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
import type {  RecordBase } from "../types/recordList/types"; // Asegúrate de que la ruta sea correcta
import { RecordListService } from "../services/recordList/recordListService";
import { useAuthStore } from "../stores/authStore"; // Ajusta la ruta según tu proyecto
import "./GroupList.css";

const RecordList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Asume que user.id es el id del integrante
  const isAdmin = false;
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<RecordBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; recordId: string | null }>({
    show: false,
    recordId: null,
  });

  // Cargar registros al montar
  useEffect(() => {
    const fetchRecords = async () => {
      if (localStorage.getItem('user_id') ==='') {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }

      try {
        const data = await RecordListService.fetchRecordsByAuthor(Number.parseInt(localStorage.getItem('user_id')||'0'));
        setRecords(data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar registros:", err);
        setError("No se pudieron cargar los registros. Verifique su conexión e inténtelo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user?.id]);

  const filteredRecords = records.filter((record) =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (recordId: string) => {
    setRecords(records.filter((r) => r.id !== recordId));
    setDeleteConfirm({ show: false, recordId: null });
  };



  const columns = [
    { key: "titulo", header: "Título", render: (r: RecordBase) => r.title },
    {
      key: "tipo",
      header: "Tipo",
      render: (r: RecordBase) => (
        <span className="badge badge-primary">{r.tipo}</span>
      ),
    },
    {
      key: "autores",
      header: "Autores",
      render: (r: RecordBase) => r.authors.map((a) => a.name).join(", "),
    },
    { key: "año", header: "Año", render: (r: RecordBase) => r.year_only },
    {
      key: "actions",
      header: "Opciones",
      render: (r: RecordBase) => (
        <OptionsMenu
          onView={() => navigate(`/records/${r.id}`)}
          onEdit={() => navigate(`/records/${r.id}/edit`)}
          onDelete={() => setDeleteConfirm({ show: true, recordId: r.id })}
        />
      ),
    },
  ];

  // Estado: Cargando
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar los datos</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="group-list">
      <div className="group-list-header">
        <div>
          <h1>Producción Científica</h1>
          <p>Gestión de registros científicos (Códice)</p>
        </div>
        {isAdmin && (
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
        </div>

        <Table data={filteredRecords} columns={columns} />
      </Card>

      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Eliminar Registro"
          message="¿Está seguro que desea eliminar este registro científico? Esta acción no se puede deshacer."
          onConfirm={() => deleteConfirm.recordId && handleDelete(deleteConfirm.recordId)}
          onCancel={() => setDeleteConfirm({ show: false, recordId: null })}
        />
      )}
    </div>
  );
};

export default RecordList;