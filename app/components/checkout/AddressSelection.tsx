'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Check, MapPin, Building, Phone, Mail } from 'lucide-react'
import { Address } from '../../lib/types'

const PRESET_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    isDefault: true,
    firstName: 'Amruth',
    lastName: 'Warrier',
    email: 'amruth@example.com',
    phone: '9876543210',
    addressLine1: '42, Indiranagar 100ft Road',
    addressLine2: 'Apartment 302, Studio Enclave',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    country: 'India',
  },
  {
    id: 'addr-2',
    label: 'Studio',
    firstName: 'Amruth',
    lastName: 'Warrier',
    email: 'amruth@keshev.com',
    phone: '9876543210',
    addressLine1: '18, Design District, Bandra West',
    addressLine2: 'Level 2, KESHEV Works',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    country: 'India',
  },
]

interface AddressSelectionProps {
  selectedAddress: Address
  onChange: (addr: Address) => void
  errors?: Record<string, string>
}

export default function AddressSelection({
  selectedAddress,
  onChange,
  errors = {},
}: AddressSelectionProps) {
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(PRESET_ADDRESSES)
  const [mode, setMode] = useState<'saved' | 'new'>('saved')
  const [sameAsBilling, setSameAsBilling] = useState(true)

  // Load user custom saved addresses if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem('keshev_saved_addresses')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.length > 0) {
          setSavedAddresses(parsed)
        }
      }
    } catch { }
  }, [])

  const handleSelectSaved = (addr: Address) => {
    onChange(addr)
  }

  const handleFieldChange = (field: keyof Address, value: string) => {
    onChange({
      ...selectedAddress,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      {/* Tab toggle between saved and new */}
      <div className="flex border-b border-black/10">
        <button
          type="button"
          onClick={() => {
            setMode('saved')
            if (savedAddresses.length > 0) onChange(savedAddresses[0])
          }}
          className={`pb-3 text-xs uppercase tracking-[.18em] transition ${mode === 'saved'
            ? 'border-b-2 border-ink font-semibold text-ink'
            : 'text-black/45 hover:text-black'
            }`}
        >
          Saved Addresses ({savedAddresses.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('new')
            onChange({
              id: `addr-${Date.now()}`,
              firstName: '',
              lastName: '',
              email: selectedAddress.email || '',
              phone: selectedAddress.phone || '',
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India',
            })
          }}
          className={`ml-8 pb-3 text-xs uppercase tracking-[.18em] transition ${mode === 'new'
            ? 'border-b-2 border-ink font-semibold text-ink'
            : 'text-black/45 hover:text-black'
            }`}
        >
          Enter New Address
        </button>
      </div>

      {mode === 'saved' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedAddresses.map((addr) => {
            const isSelected = selectedAddress.id === addr.id
            return (
              <div
                key={addr.id}
                onClick={() => handleSelectSaved(addr)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition ${isSelected
                  ? 'border-ink bg-white shadow-sm ring-1 ring-ink'
                  : 'border-black/15 bg-white/50 hover:border-black/30'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded bg-black/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-black/70">
                      <MapPin size={10} /> {addr.label || 'Address'}
                    </span>
                    {isSelected && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
                        <Check size={10} />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="mt-1 text-xs text-black/60">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </p>
                  <p className="text-xs text-black/60">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>

                <div className="mt-4 border-t border-black/5 pt-2 text-[11px] text-black/50">
                  <p className="flex items-center gap-1">
                    <Phone size={11} /> {addr.phone}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                First Name *
              </label>
              <input
                className="field"
                placeholder="e.g. John"
                value={selectedAddress.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
              />
              {errors.firstName && (
                <p className="mt-1 text-[11px] text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                Last Name *
              </label>
              <input
                className="field"
                placeholder="e.g. Doe"
                value={selectedAddress.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
              />
              {errors.lastName && (
                <p className="mt-1 text-[11px] text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                Email Address *
              </label>
              <input
                type="email"
                className="field"
                placeholder="name@domain.com"
                value={selectedAddress.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                Phone Number (10 digits) *
              </label>
              <input
                type="tel"
                className="field"
                placeholder="9876543210"
                value={selectedAddress.phone}
                onChange={(e) =>
                  handleFieldChange(
                    'phone',
                    e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                  )
                }
              />
              {errors.phone && (
                <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-black/50">
              Street Address *
            </label>
            <input
              className="field"
              placeholder="Flat / House no., Building, Street"
              value={selectedAddress.addressLine1}
              onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-[11px] text-red-600">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-black/50">
              Apartment, Suite, Landmark (Optional)
            </label>
            <input
              className="field"
              placeholder="Near Metro Station / Landmark"
              value={selectedAddress.addressLine2 || ''}
              onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                City *
              </label>
              <input
                className="field"
                placeholder="Bengaluru"
                value={selectedAddress.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
              />
              {errors.city && (
                <p className="mt-1 text-[11px] text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                State *
              </label>
              <input
                className="field"
                placeholder="Karnataka"
                value={selectedAddress.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
              />
              {errors.state && (
                <p className="mt-1 text-[11px] text-red-600">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-black/50">
                PIN Code *
              </label>
              <input
                className="field"
                placeholder="560038"
                value={selectedAddress.pincode}
                onChange={(e) =>
                  handleFieldChange(
                    'pincode',
                    e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                  )
                }
              />
              {errors.pincode && (
                <p className="mt-1 text-[11px] text-red-600">{errors.pincode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div className="pt-2">
        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-black/70">
          <input
            type="checkbox"
            checked={sameAsBilling}
            onChange={(e) => setSameAsBilling(e.target.checked)}
            className="h-4 w-4 rounded accent-ink"
          />
          <span>Billing address is the same as delivery address</span>
        </label>
      </div>
    </div>
  )
}
export { PRESET_ADDRESSES }

