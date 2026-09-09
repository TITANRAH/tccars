"use client"

import { ConfirmActionButton } from "@/components/admin/confirm-action-button"
import { deleteAppointmentAction } from "@/features/appointments/actions/appointment.actions"

export function DeleteAppointmentButton({ appointmentId }: { appointmentId: string }) {
  return (
    <ConfirmActionButton
      label="Eliminar cita"
      title="¿Eliminar esta cita?"
      description="Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      onConfirm={() => deleteAppointmentAction(appointmentId)}
    />
  )
}
