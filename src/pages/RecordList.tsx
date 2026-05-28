"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Table } from "../components/common/Table";
import { OptionsMenu } from "../components/common/OptionsMenu";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import type { Registro } from "../types/recordList/Registros";
import { RecordListService } from "../services/recordList/recordListService";
import { useAuthStore } from "../stores/authStore";
import { usePermissions } from "../hooks/usePermissions";
import { zenodoService } from "../services/zenodoService";
import { ZenodoPublishModal } from "../components/zenodo/ZenodoPublishModal";
import {
  buildPublicationKey,
  isRecordPublishedInZenodo,
  mapRecordTypeToEntityType,
} from "../utils/zenodoEntityMapper";
import type { RecordType } from "../types";
import type { ZenodoPublishTarget } from "../types/zenodo";
import "../components/zenodo/ZenodoPublishModal.css";
import "./GroupList.css";

const RecordList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { canCreateRecords, canModifyRecord, canDeleteRecord, isIntegrant, canPublishToZenodo } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordFilter, setRecordFilter] = useState<"all" | "mine">("all");
  const [publishedZenodoKeys, setPublishedZenodoKeys] = useState<Set<string>>(new Set());
  const [zenodoStatusLoaded, setZenodoStatusLoaded] = useState(false);
  const [showZenodoModal, setShowZenodoModal] = useState(false);
  const [zenodoTarget, setZenodoTarget] = useState<ZenodoPublishTarget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    show: boolean; 
    recordId: string | null; 
    recordType: string | null;
  }>({
    show: false,
    recordId: null,
    recordType: null,
  });

  const userId = user?.id ? parseInt(user.id) : null;

  // Cargar registros al montar el componente o cambiar el filtro o término de búsqueda
  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedRecords: Registro[];
        
        // Usar el término de búsqueda si existe
        const searchParam = searchTerm.trim() || undefined;
        
        if (recordFilter === "mine" && userId) {
          // Cargar solo los registros del usuario actual
          fetchedRecords = await RecordListService.fetchRecordsByAuthor(userId, searchParam);
        } else {
          // Cargar todos los registros
          fetchedRecords = await RecordListService.fetchAllRecords(searchParam);
        }
        
        setRecords(fetchedRecords);
      } catch (err) {
        console.error("Error cargando registros:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los registros");
      } finally {
        setLoading(false);
      }
    };

    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      loadRecords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recordFilter, userId, searchTerm]);

  useEffect(() => {
    const loadZenodoPublications = async () => {
      try {
        const publications = await zenodoService.listPublications("published");
        const keys = new Set(
          publications.map((publication) =>
            buildPublicationKey(publication.entity_type, publication.entity_id),
          ),
        );
        setPublishedZenodoKeys(keys);
        setZenodoStatusLoaded(true);
      } catch (err) {
        console.error("Error cargando publicaciones Zenodo:", err);
        setZenodoStatusLoaded(false);
      }
    };

    loadZenodoPublications();
  }, [records]);

  const isAuthor = (record: Registro): boolean => {
    if (!userId) return false;
    return record.autores.some((autor) => autor.id_integrant === userId);
  };
  const buildRecordPath = (record: Registro) => `/records/${record.tipo}-${record.id}`;

  const navigateWithRecord = (record: Registro, mode: "view" | "edit" = "view") => {
    const basePath = buildRecordPath(record);
    const targetPath = mode === "edit" ? `${basePath}/edit` : basePath;
    navigate(targetPath, { state: { record } });
  };


  const canEdit = (record: Registro): boolean => {
    return canModifyRecord(isAuthor(record));
  };

  const canDelete = (record: Registro): boolean => {
    return canDeleteRecord(isAuthor(record));
  };

  // La búsqueda ya se hace en el backend, pero podemos mantener el filtrado local como respaldo
  const filteredRecords = records;

  const handleDelete = async (recordId: string, recordType: string) => {
    try {
      await RecordListService.deleteRecord(recordId, recordType);
      const searchParam = searchTerm.trim() || undefined;
      if (recordFilter === "mine" && userId) {
        const updatedRecords = await RecordListService.fetchRecordsByAuthor(userId, searchParam);
        setRecords(updatedRecords);
      } else {
        const updatedRecords = await RecordListService.fetchAllRecords(searchParam);
        setRecords(updatedRecords);
      }
      setDeleteConfirm({ show: false, recordId: null, recordType: null });
    } catch (err) {
      console.error("Error eliminando registro:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar el registro");
    }
  };

  const handleOpenZenodoPublish = (record: Registro) => {
    const entityId = parseInt(record.id, 10);
    if (Number.isNaN(entityId)) return;

    setZenodoTarget({
      entityType: mapRecordTypeToEntityType(record.tipo as RecordType),
      entityId,
      recordType: record.tipo as RecordType,
      title: record.titulo,
    });
    setShowZenodoModal(true);
  };

  const handleZenodoPublished = () => {
    if (!zenodoTarget) return;
    setPublishedZenodoKeys((prev) => {
      const next = new Set(prev);
      next.add(buildPublicationKey(zenodoTarget.entityType, zenodoTarget.entityId));
      return next;
    });
    setZenodoStatusLoaded(true);
  };

  const renderZenodoStatus = (record: Registro) => {
    if (!zenodoStatusLoaded) {
      return <span className="badge-zenodo-unknown">Sin datos</span>;
    }

    const isPublished = isRecordPublishedInZenodo(record.tipo as RecordType, record.id, publishedZenodoKeys);

    if (isPublished) {
      return <span className="badge-zenodo-published">Publicado</span>;
    }

    return <span className="badge-zenodo-unpublished">No publicado</span>;
  };

  const columns = [
    {
      key: "titulo",
      header: "Título",
      render: (r: Registro) => r.titulo,
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (r: Registro) => <span className="badge badge-primary">{r.tipoFormateado}</span>,
    },
    {
      key: "autores",
      header: "Autores",
      render: (r: Registro) => r.autoresTexto,
    },
    {
      key: "año",
      header: "Año",
      render: (r: Registro) => r.year_only,
    },
    {
      key: "zenodo",
      header: "Zenodo",
      render: (record: Registro) => renderZenodoStatus(record),
    },
    {
      key: "actions",
      header: "Opciones",
      render: (record: Registro) => {
        const canEditRecord = canEdit(record);
        const canDeleteRecordAction = canDelete(record);
        const isPublished = zenodoStatusLoaded
          ? isRecordPublishedInZenodo(record.tipo as RecordType, record.id, publishedZenodoKeys)
          : false;
        const canPublishRecord = canPublishToZenodo() && !isPublished;

        const menuOptions: Array<{ label: string; onClick: () => void; className?: string }> = [
          {
            label: "Ver detalles",
            onClick: () => navigateWithRecord(record),
          },
        ];

        if (canEditRecord) {
          menuOptions.push({
            label: "Modificar",
            onClick: () => navigateWithRecord(record, "edit"),
          });
        }

        if (canPublishRecord) {
          menuOptions.push({
            label: "Publicar en Zenodo",
            onClick: () => handleOpenZenodoPublish(record),
          });
        }

        if (canDeleteRecordAction) {
          menuOptions.push({
            label: "Eliminar",
            onClick: () =>
              setDeleteConfirm({
                show: true,
                recordId: record.id,
                recordType: record.tipo,
              }),
            className: "delete",
          });
        }

        if (menuOptions.length > 1 || canPublishRecord) {
          return <OptionsMenu options={menuOptions} />;
        }

        return (
          <Button variant="outline" onClick={() => navigateWithRecord(record)}>
            Ver detalles
          </Button>
        );
      },
    },
  ];

  return (
    <div className="group-list">
      <div className="group-list-header">
        <div>
          <h1>Producción Científica</h1>
          <p>Gestión de registros científicos (Códice)</p>
        </div>
        {canCreateRecords() && (
          <Button onClick={() => navigate("/records/new")}>
            <Plus size={20} />
            Adicionar Registro
          </Button>
        )}
      </div>

      <Card>
        <div className="group-list-filters">
          <div className="group-list-search">
            <Search size={20} />
            <Input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isIntegrant() && (
            <div className="filter-group">
              <label>Filtrar:</label>
              <select
                value={recordFilter}
                onChange={(e) => setRecordFilter(e.target.value as "all" | "mine")}
                className="form-select"
              >
                <option value="all">Todos los registros</option>
                <option value="mine">Mis registros</option>
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={32} />
            <span style={{ marginLeft: '1rem' }}>Cargando registros...</span>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            margin: '1rem', 
            backgroundColor: '#fee', 
            color: '#c33',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredRecords.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No se encontraron registros</p>
              </div>
            ) : (
              <Table data={filteredRecords} columns={columns} />
            )}
          </>
        )}
      </Card>

      {deleteConfirm.recordId && deleteConfirm.recordType && (
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Eliminar Registro"
          message="¿Está seguro que desea eliminar este registro científico? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(deleteConfirm.recordId!, deleteConfirm.recordType!)}
          onCancel={() => setDeleteConfirm({ show: false, recordId: null, recordType: null })}
        />
      )}

      <ZenodoPublishModal
        isOpen={showZenodoModal}
        target={zenodoTarget}
        onClose={() => {
          setShowZenodoModal(false);
          setZenodoTarget(null);
        }}
        onPublished={handleZenodoPublished}
      />
    </div>
  );
};

export default RecordList;