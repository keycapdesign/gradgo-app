import { CheckCircle } from 'lucide-react'

interface SuccessScreenProps {
  studentName: string
}

export function SuccessScreen({ studentName }: SuccessScreenProps) {
  return (
    <div className="w-full max-w-md text-center space-y-6">
      <CheckCircle className="mx-auto h-24 w-24 text-primary" />
      <h1 className="text-3xl font-bold">Gown Successfully Returned!</h1>
      <p className="text-xl">Thank you, {studentName}.</p>
      <p>Your gown has been checked in.</p>
    </div>
  )
}
