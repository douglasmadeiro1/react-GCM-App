export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/D';
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatCPF(cpf: string | null): string {
  if (!cpf) return '';
  const numbers = cpf.replace(/[^\d]/g, '');
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

export function calcularProximaPromocao(dataPortaria: string | null): string | null {
  if (!dataPortaria) return null;
  const data = new Date(dataPortaria);
  if (isNaN(data.getTime())) return null;
  data.setFullYear(data.getFullYear() + 3);
  return data.toISOString().split('T')[0];
}