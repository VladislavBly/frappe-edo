import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { api } from '../lib/api'
import type { EDOCorrespondent } from '../api/references/types'

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
  const { t } = useTranslation()
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
      alert(t('addCorrespondent.enterName'))
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
      alert(t('addCorrespondent.createError'))
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
          <DialogTitle className="text-xl">{t('addCorrespondent.newCorrespondent')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correspondent_name">
              {t('addCorrespondent.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="correspondent_name"
              placeholder={t('addCorrespondent.enterName')}
              value={correspondentName}
              onChange={e => setCorrespondentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correspondent_type">{t('addCorrespondent.typeLabel')}</Label>
            <Select value={correspondentType} onValueChange={setCorrespondentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Физическое лицо">{t('addCorrespondent.physicalPerson')}</SelectItem>
                <SelectItem value="Юридическое лицо">{t('addCorrespondent.legalPerson')}</SelectItem>
                <SelectItem value="Государственная организация">
                  {t('addCorrespondent.stateOrg')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">{t('addCorrespondent.organizationLabel')}</Label>
              <Input
                id="organization"
                placeholder={t('addCorrespondent.organizationPlaceholder')}
                value={organization}
                onChange={e => setOrganization(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">{t('addCorrespondent.innLabel')}</Label>
              <Input
                id="inn"
                placeholder={t('addCorrespondent.innPlaceholder')}
                value={inn}
                onChange={e => setInn(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('addCorrespondent.addressLabel')}</Label>
            <Textarea
              id="address"
              placeholder={t('addCorrespondent.addressPlaceholder')}
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">{t('addCorrespondent.contactPersonLabel')}</Label>
              <Input
                id="contact_person"
                placeholder={t('addCorrespondent.contactPersonPlaceholder')}
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('addCorrespondent.phoneLabel')}</Label>
              <Input
                id="phone"
                placeholder={t('addCorrespondent.phonePlaceholder')}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('addCorrespondent.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('addCorrespondent.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
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
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? t('addCorrespondent.creating') : t('addCorrespondent.create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
