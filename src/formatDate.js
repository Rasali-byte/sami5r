import { format, parseISO } from 'date-fns';

export function formatDate(dateString) {
  return format(parseISO(dateString), 'yyyy-MM-dd');
}
