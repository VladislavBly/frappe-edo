import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { api, type EDOCorrespondent } from '../lib/api'

interface AddCorrespondentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCorrespondentCreated?: (correspondent: EDOCorrespondent) => void
}

export function AddCorrespondentDialog({
  open,
  onOpenChange,
  onCorrespondentCreated,
}: AddCorrespondentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [correspondentName, setCorrespondentName] = useState('')
  const [correspondentType, setCorrespondentType] = useState('Юридическое лицо')
  const [organization, setOrganization] = useState('')
  const [inn, setInn] = useState('')
  const [address, setAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async () => {
    if (!correspondentName) {
      alert('Введите название корреспондента')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${window.location.origin}/api/resource/EDO Correspondent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Frappe-CSRF-Token': api['getCSRFToken'](),
        },
        body: JSON.stringify({
          correspondent_name: correspondentName,
          correspondent_type: correspondentType,
          organization_name: organization,
          inn,
          address,
          contact_person: contactPerson,
          phone,
          email,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create correspondent')
      }

      const data = await response.json()
      const newCorrespondent: EDOCorrespondent = {
        name: data.data.name,
        correspondent_name: data.data.correspondent_name,
      }

      onCorrespondentCreated?.(newCorrespondent)
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create correspondent:', error)
      alert('Ошибка при создании корреспондента')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCorrespondentName('')
    setCorrespondentType('Юридическое лицо')
    setOrganization('')
    setInn('')
    setAddress('')
    setContactPerson('')
    setPhone('')
    setEmail('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Новый корреспондент</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correspondent_name">
              Название <span className="text-red-500">*</span>
            </Label>
            <Input
              id="correspondent_name"
              placeholder="Введите название корреспондента"
              value={correspondentName}
              onChange={(e) => setCorrespondentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correspondent_type">Тип корреспондента</Label>
            <Select value={correspondentType} onValueChange={setCorrespondentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Физическое лицо">Физическое лицо</SelectItem>
                <SelectItem value="Юридическое лицо">Юридическое лицо</SelectItem>
                <SelectItem value="Государственная организация">
                  Государственная организация
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Полное название организации</Label>
              <Input
                id="organization"
                placeholder="ООО «Компания»"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">ИНН</Label>
              <Input
                id="inn"
                placeholder="1234567890"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Textarea
              id="address"
              placeholder="г. Ташкент, ул. Примерная, д. 1"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Контактное лицо</Label>
              <Input
                id="contact_person"
                placeholder="Иванов И.И."
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
