export function fullName(user: { firstName: string; lastName: string }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ")
}

export function toStaffOptions(staff: { id: string; firstName: string; lastName: string }[]) {
  return staff.map((s) => ({ id: s.id, name: fullName(s) }))
}

export function calculateAge(birthDate: Date | null | undefined) {
  if (!birthDate) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}
