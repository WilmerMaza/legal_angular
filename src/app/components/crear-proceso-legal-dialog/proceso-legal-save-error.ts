import { HttpErrorResponse } from '@angular/common/http';

export function mapProcesoLegalSaveError(error: unknown, mode: 'create' | 'edit'): string {
  const generic =
    mode === 'edit'
      ? 'No se pudo editar el radicado. Revisa los datos o el servidor e intenta de nuevo.'
      : 'No se pudo crear el radicado. Revisa los datos o el servidor e intenta de nuevo.';

  if (!(error instanceof HttpErrorResponse)) {
    return generic;
  }

  if (error.status === 409) {
    const fromApi = extractBackendMessage(error.error);
    return fromApi || 'Ya existe un radicado con ese número.';
  }

  if (error.status === 400) {
    const fromApi = extractBackendMessage(error.error);
    if (fromApi) return fromApi;
    return mode === 'create'
      ? 'Revisa los datos: el número y la cuenta son obligatorios.'
      : 'Revisa los datos del radicado (incluye la etapa del proceso).';
  }

  if (error.status === 404) {
    return 'No se encontró la cuenta o el radicado.';
  }

  return generic;
}

function extractBackendMessage(errorBody: unknown): string {
  if (!errorBody || typeof errorBody !== 'object') return '';
  const candidate = errorBody as {
    message?: unknown;
    error?: unknown;
    details?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
  };
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    const field = candidate.details?.fieldErrors;
    if (field) {
      const etapaErr = field['etapa_proceso']?.[0];
      if (etapaErr) return `Etapa inválida: ${etapaErr}`;
      const first = Object.entries(field).find(([, msgs]) => msgs && msgs.length > 0);
      if (first?.[1]?.[0]) return `${first[0]}: ${first[1][0]}`;
    }
    if (candidate.message !== 'Payload invalido') return candidate.message;
  }
  if (Array.isArray(candidate.message) && typeof candidate.message[0] === 'string') {
    return candidate.message[0];
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }
  return '';
}
