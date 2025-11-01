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
import { convertCurrency, formatCurrency } from "@/lib/currency";
import { useStore } from "@/store/useStore";
import type { Activo } from "@/types/persistencia";
import {
  DollarSign,
  Edit,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";

export function ActivosPage() {
  const {
    activos,
    cuentas,
    addActivo,
    updateActivo,
    deleteActivo,
    isLoadingExchangeRates,
    updateExchangeRatesCache,
    exchangeRatesCache,
    prefs,
  } = useStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
  const [convertedValues, setConvertedValues] = useState<
    Record<string, number>
  >({});
  const [totalPortfolio, setTotalPortfolio] = useState<number>(0);
  const [formData, setFormData] = useState({
    clase: "efectivo" as const,
    ticker: "",
    moneda: "COP" as const,
    cantidad: 0,
    costoPromedio: 0,
    cuentaId: "",
  });

  // 🌐 Cargar tasas y calcular valores convertidos
  useEffect(() => {
    updateExchangeRatesCache();
  }, [updateExchangeRatesCache]);

  // 📊 Calcular valores convertidos cuando cambien las tasas o activos
  useEffect(() => {
    const calculateConvertedValues = async () => {
      const newConvertedValues: Record<string, number> = {};
      let total = 0;

      for (const activo of activos) {
        const valorEnMonedaOriginal =
          activo.cantidad * (activo.costoPromedio || 0);
        const valorConvertido = await convertCurrency(
          valorEnMonedaOriginal,
          activo.moneda,
          prefs.monedaBase,
          exchangeRatesCache
        );
        newConvertedValues[activo.id] = valorConvertido;
        total += valorConvertido;
      }

      setConvertedValues(newConvertedValues);
      setTotalPortfolio(total);
    };

    if (Object.keys(exchangeRatesCache).length > 0) {
      calculateConvertedValues();
    }
  }, [activos, exchangeRatesCache, prefs.monedaBase]);

  const getCuentaNombre = (id: string) => {
    const cuenta = cuentas.find((c) => c.id === id);
    return cuenta?.nombre || "Cuenta eliminada";
  };

  const getClaseColor = (clase: string) => {
    const colors = {
      accion: "text-blue-600 bg-blue-100",
      etf: "text-green-600 bg-green-100",
      fondo: "text-purple-600 bg-purple-100",
      bono: "text-yellow-600 bg-yellow-100",
      cripto: "text-orange-600 bg-orange-100",
      efectivo: "text-gray-600 bg-gray-100",
      cde: "text-amber-600 bg-amber-100",
      otro: "text-slate-600 bg-slate-100",
    };
    return colors[clase as keyof typeof colors] || colors.otro;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingActivo) {
      updateActivo(editingActivo.id, formData);
    } else {
      addActivo(formData);
    }

    // Reset form
    setFormData({
      clase: "efectivo",
      ticker: "",
      moneda: "COP",
      cantidad: 0,
      costoPromedio: 0,
      cuentaId: "",
    });
    setEditingActivo(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (activo: Activo) => {
    setEditingActivo(activo);
    setFormData({
      clase: activo.clase as any,
      ticker: activo.ticker || "",
      moneda: activo.moneda as any,
      cantidad: activo.cantidad,
      costoPromedio: activo.costoPromedio || 0,
      cuentaId: activo.cuentaId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este activo?")) {
      deleteActivo(id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Activos
            {isLoadingExchangeRates && (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500" />
            )}
          </h1>
          <div className="space-y-2">
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tus posiciones e inversiones
            </p>
            {totalPortfolio > 0 && (
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                    Portafolio total:
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">
                    {formatCurrency(totalPortfolio, prefs.monedaBase)}
                  </span>
                </div>
              </div>
            )}
            {isLoadingExchangeRates && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 sm:px-3 py-1 rounded w-fit">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  Actualizando tasas de cambio...
                </span>
                <span className="sm:hidden">Actualizando tasas...</span>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto shrink-0"
              onClick={() => {
                setEditingActivo(null);
                setFormData({
                  clase: "efectivo",
                  ticker: "",
                  moneda: "COP",
                  cantidad: 0,
                  costoPromedio: 0,
                  cuentaId: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Activo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingActivo ? "Editar Activo" : "Nuevo Activo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="cuenta">Cuenta</Label>
                <Select
                  value={formData.cuentaId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, cuentaId: value }))
                  }
                  required
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

              <div>
                <Label htmlFor="clase">Clase de Activo</Label>
                <Select
                  value={formData.clase}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, clase: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="accion">Acción</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="fondo">Fondo</SelectItem>
                    <SelectItem value="bono">Bono</SelectItem>
                    <SelectItem value="cripto">Cripto</SelectItem>
                    <SelectItem value="cde">CDE</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ticker">Ticker/Símbolo (opcional)</Label>
                <Input
                  id="ticker"
                  value={formData.ticker}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ticker: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Ej: BCOLOMBIA, BTC"
                />
              </div>

              <div>
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={formData.moneda}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, moneda: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cantidad: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="costoPromedio">Costo Promedio (opcional)</Label>
                <Input
                  id="costoPromedio"
                  type="number"
                  value={formData.costoPromedio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      costoPromedio: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  min="0"
                  step="0.01"
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
                  {editingActivo ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            Tus Activos ({activos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {activos.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">
                No tienes activos registrados.
              </p>
              <p className="text-xs sm:text-sm">¡Agrega tu primera posición!</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Clase</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">
                        Costo Promedio
                      </TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">
                        Valor en {prefs.monedaBase}
                      </TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activos.map((activo) => {
                      const valorTotal =
                        activo.cantidad * (activo.costoPromedio || 0);
                      const valorConvertido = convertedValues[activo.id] || 0;
                      return (
                        <TableRow key={activo.id}>
                          <TableCell className="font-mono font-bold">
                            {activo.ticker || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getClaseColor(
                                activo.clase
                              )}`}
                            >
                              {activo.clase}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getCuentaNombre(activo.cuentaId)}
                          </TableCell>
                          <TableCell>{activo.moneda}</TableCell>
                          <TableCell className="text-right font-mono">
                            {activo.cantidad.toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {activo.costoPromedio
                              ? formatCurrency(
                                  activo.costoPromedio,
                                  activo.moneda
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCurrency(valorTotal, activo.moneda)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-green-600">
                            {valorConvertido > 0
                              ? formatCurrency(
                                  valorConvertido,
                                  prefs.monedaBase
                                )
                              : "Calculando..."}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(activo)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(activo.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Mobile/Tablet - Cards */}
              <div className="lg:hidden space-y-3">
                {activos.map((activo) => {
                  const valorTotal =
                    activo.cantidad * (activo.costoPromedio || 0);
                  const valorConvertido = convertedValues[activo.id] || 0;
                  return (
                    <Card
                      key={activo.id}
                      className="p-3 border-l-4 border-l-blue-500"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-bold text-sm">
                              {activo.ticker || "N/A"}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getClaseColor(
                                activo.clase
                              )}`}
                            >
                              {activo.clase}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getCuentaNombre(activo.cuentaId)}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(activo)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(activo.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Cantidad</p>
                          <p className="font-mono font-medium">
                            {activo.cantidad.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Moneda</p>
                          <p className="font-medium">{activo.moneda}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Costo Promedio
                          </p>
                          <p className="font-mono font-medium">
                            {activo.costoPromedio
                              ? formatCurrency(
                                  activo.costoPromedio,
                                  activo.moneda
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Valor Total
                          </p>
                          <p className="font-mono font-medium">
                            {formatCurrency(valorTotal, activo.moneda)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-1">
                            Valor en {prefs.monedaBase}
                          </p>
                          <p className="font-mono font-bold text-green-600 text-sm">
                            {valorConvertido > 0
                              ? formatCurrency(
                                  valorConvertido,
                                  prefs.monedaBase
                                )
                              : "Calculando..."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
