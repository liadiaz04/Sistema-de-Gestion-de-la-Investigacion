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
import { Plus, Search, Loader2 } from "lucide-react";
import type { Registro } from "../types/recordList/Registros";
import { RecordListService } from "../services/recordList/recordListService";
import { useAuthStore } from "../stores/authStore";
import { usePermissions } from "../hooks/usePermissions";
import { useToast } from "../contexts/ToastContext";

const RecordList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const { canCreateRecords, canModifyRecord, canDeleteRecord, isIntegrant } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordFilter, setRecordFilter] = useState<"all" | "mine">("all");
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
        showToast(err instanceof Error ? err.message : "Error al cargar los registros", "error");
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
      // Recargar la lista después de eliminar (mantener los filtros actuales)
      const searchParam = searchTerm.trim() || undefined;
      if (recordFilter === "mine" && userId) {
        const updatedRecords = await RecordListService.fetchRecordsByAuthor(userId, searchParam);
        setRecords(updatedRecords);
      } else {
        const updatedRecords = await RecordListService.fetchAllRecords(searchParam);
        setRecords(updatedRecords);
      }
      setDeleteConfirm({ show: false, recordId: null, recordType: null });
      showToast("Registro eliminado correctamente", "success");
    } catch (err) {
      console.error("Error eliminando registro:", err);
      showToast(err instanceof Error ? err.message : "Error al eliminar el registro", "error");
    }
  };

  const columns = [
    { 
      key: "titulo", 
      header: "Título", 
      render: (r: Registro) => r.titulo 
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (r: Registro) => (
        <span className="badge badge-primary">{r.tipoFormateado}</span>
      ),
    },
    {
      key: "autores",
      header: "Autores",
      render: (r: Registro) => r.autoresTexto,
    },
    { 
      key: "año", 
      header: "Año", 
      render: (r: Registro) => r.year_only 
    },
    {
      key: "actions",
      header: "Opciones",
      render: (record: Registro) => {
        const canEditRecord = canEdit(record);
        const canDeleteRecord = canDelete(record);
        
        // INTEGRANT solo ve opciones si es autor, CONSEJO y ADMIN siempre ven opciones
        if (canEditRecord || canDeleteRecord) {
          return (
            <OptionsMenu
              onView={() => navigateWithRecord(record)}
              onEdit={
                canEditRecord
                  ? () => navigateWithRecord(record, "edit")
                  : undefined
              }
              onDelete={
                canDeleteRecord
                  ? () =>
                      setDeleteConfirm({
                        show: true,
                        recordId: record.id,
                        recordType: record.tipo,
                      })
                  : undefined
              }
            />
          );
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
    <div className="list-page">
      <div className="page-toolbar list-page__toolbar">
        <p className="page-toolbar__lead">Gestión de registros y producción científica.</p>
        {canCreateRecords() && (
          <Button onClick={() => navigate("/records/new")}>
            <Plus size={20} />
            Adicionar Registro
          </Button>
        )}
      </div>

      <Card className="list-page__panel">
        <div className="list-page__filters">
          <div className="list-page__search">
            <Search size={20} aria-hidden />
            <Input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar registros"
            />
          </div>
          {!isIntegrant() ? (
            <div className="list-page__filter-group list-page__filter-group--inline">
              <label htmlFor="record-filter">Filtrar:</label>
              <select
                id="record-filter"
                value={recordFilter}
                onChange={(e) => setRecordFilter(e.target.value as "all" | "mine")}
                className="list-page__select"
              >
                <option value="all">Todos los registros</option>
                <option value="mine">Mis registros</option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="list-page__body">
          {loading ? (
            <div className="list-page__loading" role="status" aria-live="polite">
              <Loader2 className="animate-spin" size={32} aria-hidden />
              <span>Cargando registros...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="list-page__empty">
              <p>No se encontraron registros</p>
            </div>
          ) : (
            <>
              <p className="list-page__count">
                {filteredRecords.length}{" "}
                {filteredRecords.length === 1 ? "registro" : "registros"}
              </p>
              <Table data={filteredRecords} columns={columns} />
            </>
          )}
        </div>
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
    </div>
  );
};

export default RecordList;