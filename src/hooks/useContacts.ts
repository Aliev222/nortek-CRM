import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Contact, ContactKind } from '../types'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true })
    setContacts(data ?? [])
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Возвращает id существующего контрагента (по имени, без учёта регистра)
  // или создаёт нового и возвращает его id.
  const findOrCreate = async (name: string, kind: ContactKind): Promise<string | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const existing = contacts.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id

    const { data, error } = await supabase
      .from('contacts')
      .insert({ name: trimmed, kind })
      .select('id')
      .single()
    if (error || !data) return null

    await fetchContacts()
    return data.id
  }

  return { contacts, findOrCreate, refetch: fetchContacts }
}
