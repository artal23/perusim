'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface ResumenRow {
  mes: string;
  local: string;
  transacciones: number;
  ingresos_sin_igv: number;
  ingresos_con_igv: number;
}

const formatCurrency = (value: number) =>
  `S/.${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

const LOCALES = ['LAP', 'Kennedy', 'Larco', 'Cusco', 'Otros'];

export default function ResumenPage() {
  const [data, setData] = useState<ResumenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/resumen')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Error al cargar datos'); setLoading(false); });
  }, []);

  const meses = [...new Set(data.map((r) => r.mes))];
  const getValue = (mes: string, local: string) =>
    data.find((r) => r.mes === mes && r.local === local);

  if (loading) return <p className="text-gray-500">Cargando datos...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumen General</h1>
      {meses.map((mes) => (
        <Card key={mes} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{mes}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 hover:bg-gray-800">
                  <TableHead className="text-white font-bold">Local</TableHead>
                  <TableHead className="text-white font-bold text-right">Transacciones</TableHead>
                  <TableHead className="text-white font-bold text-right">Ingresos sin IGV</TableHead>
                  <TableHead className="text-white font-bold text-right">Ingresos con IGV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOCALES.map((local, i) => {
                  const row = getValue(mes, local);
                  return (
                    <TableRow key={local} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <TableCell className="font-medium">{local}</TableCell>
                      <TableCell className="text-right">{row?.transacciones ?? '-'}</TableCell>
                      <TableCell className="text-right">{row ? formatCurrency(row.ingresos_sin_igv) : '-'}</TableCell>
                      <TableCell className="text-right">{row ? formatCurrency(row.ingresos_con_igv) : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}