import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { useStore } from "@/store/useStore";
import type { TipoTransaccion, Transaccion } from "@/types/persistencia";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeftRight, Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function TransaccionesPage() {
  const {
    transacciones,
    cuentas,
    activos,
    addTransaccion,
    updateTransaccion,
    deleteTransaccion,
  } = useStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaccion, setEditingTransaccion] =
    useState<Transaccion | null>(null);
  const [formData, setFormData] = useState({
    tipo: "deposito" as TipoTransaccion,
    cuentaOrigenId: "",
    cuentaDestinoId: "",
    activoId: "",
    monto: 0,
    cantidad: 0,
    precio: 0,
    comision: 0,
    fecha: "",
    concepto: "",
  });

  const getCuentaNombre = (id?: string) => {
    if (!id) return "N/A";
    const cuenta = cuentas.find((c) => c.id === id);
    return cuenta?.nombre || "Cuenta eliminada";
  };

  const getActivoInfo = (id?: string) => {
    if (!id) return "N/A";
    const activo = activos.find((a) => a.id === id);
    return activo
      ? `${activo.ticker || activo.clase} (${activo.clase})`
      : "Activo eliminado";
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      compra: "text-green-600 bg-green-100",
      venta: "text-red-600 bg-red-100",
      rendimiento: "text-blue-600 bg-blue-100",
      deposito: "text-purple-600 bg-purple-100",
      retiro: "text-orange-600 bg-orange-100",
      transferencia: "text-gray-600 bg-gray-100",
      comision: "text-red-600 bg-red-100",
    };
    return colors[tipo as keyof typeof colors] || "text-gray-600 bg-gray-100";
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MMM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTransaccion) {
      updateTransaccion(editingTransaccion.id, formData);
    } else {
      addTransaccion(formData);
    }

    // Reset form
    setFormData({
      tipo: "deposito",
      cuentaOrigenId: "",
      cuentaDestinoId: "",
      activoId: "",
      monto: 0,
      cantidad: 0,
      precio: 0,
      comision: 0,
      fecha: "",
      concepto: "",
    });
    setEditingTransaccion(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (transaccion: Transaccion) => {
    setEditingTransaccion(transaccion);
    setFormData({
      tipo: transaccion.tipo,
      cuentaOrigenId: transaccion.cuentaOrigenId || "",
      cuentaDestinoId: transaccion.cuentaDestinoId || "",
      activoId: transaccion.activoId || "",
      monto: transaccion.monto || 0,
      cantidad: transaccion.cantidad || 0,
      precio: transaccion.precio || 0,
      comision: transaccion.comision || 0,
      fecha: transaccion.fecha,
      concepto: transaccion.concepto || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta transacción?")) {
      deleteTransaccion(id);
    }
  };

  // Ordenar transacciones por fecha (más recientes primero)
  const sortedTransacciones = [...transacciones].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const requiereActivo =
    formData.tipo === "compra" ||
    formData.tipo === "venta" ||
    formData.tipo === "rendimiento";

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2 sm:mb-3">
            <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Transacciones
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Historial de todas tus operaciones y movimientos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto shrink-0"
              onClick={() => {
                setEditingTransaccion(null);
                setFormData({
                  tipo: "deposito",
                  cuentaOrigenId: "",
                  cuentaDestinoId: "",
                  activoId: "",
                  monto: 0,
                  cantidad: 0,
                  precio: 0,
                  comision: 0,
                  fecha: new Date().toISOString().split("T")[0],
                  concepto: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingTransaccion
                  ? "Editar Transacción"
                  : "Nueva Transacción"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="tipo">Tipo de Transacción</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      tipo: value as TipoTransaccion,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="rendimiento">Rendimiento</SelectItem>
                    <SelectItem value="comision">Comisión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cuentaOrigen">Cuenta Origen</Label>
                <Select
                  value={formData.cuentaOrigenId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, cuentaOrigenId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "transferencia" && (
                <div>
                  <Label htmlFor="cuentaDestino">Cuenta Destino</Label>
                  <Select
                    value={formData.cuentaDestinoId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        cuentaDestinoId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cuenta destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requiereActivo && (
                <div>
                  <Label htmlFor="activo">Activo</Label>
                  <Select
                    value={formData.activoId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, activoId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un activo" />
                    </SelectTrigger>
                    <SelectContent>
                      {activos.map((activo) => (
                        <SelectItem key={activo.id} value={activo.id}>
                          {activo.ticker || activo.clase} - {activo.clase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monto: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="concepto">Concepto (opcional)</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      concepto: e.target.value,
                    }))
                  }
                  placeholder="Descripción de la transacción"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingTransaccion ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            Historial de Transacciones ({transacciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {transacciones.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">
                No tienes transacciones registradas.
              </p>
              <p className="text-xs sm:text-sm">
                ¡Registra tu primera operación!
              </p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cuenta Origen</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>{formatDate(transaccion.fecha)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTipoColor(
                              transaccion.tipo
                            )}`}
                          >
                            {transaccion.tipo}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getCuentaNombre(transaccion.cuentaOrigenId)}
                        </TableCell>
                        <TableCell>
                          {getActivoInfo(transaccion.activoId)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {transaccion.monto
                            ? formatCurrency(transaccion.monto)
                            : "-"}
                        </TableCell>
                        <TableCell>{transaccion.concepto || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(transaccion)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(transaccion.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Mobile/Tablet - Cards */}
              <div className="lg:hidden space-y-3">
                {sortedTransacciones.map((transaccion) => (
                  <Card
                    key={transaccion.id}
                    className="p-3 border-l-4 border-l-blue-500"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTipoColor(
                              transaccion.tipo
                            )}`}
                          >
                            {transaccion.tipo}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(transaccion.fecha)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getCuentaNombre(transaccion.cuentaOrigenId)}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(transaccion)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(transaccion.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Monto</p>
                        <p className="font-mono font-bold text-base">
                          {transaccion.monto
                            ? formatCurrency(transaccion.monto)
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Activo</p>
                        <p className="font-medium truncate">
                          {getActivoInfo(transaccion.activoId)}
                        </p>
                      </div>
                      {transaccion.concepto && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-1">Concepto</p>
                          <p className="font-medium text-sm">
                            {transaccion.concepto}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
