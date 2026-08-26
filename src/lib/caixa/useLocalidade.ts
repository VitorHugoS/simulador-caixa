'use client'

import { useEffect, useState } from 'react'
import { fetchUFs, fetchMunicipios } from './api'
import type { CaixaUF, CaixaMunicipio } from './types'

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function useLocalidade() {
  const [ufs, setUfs] = useState<CaixaUF[]>([])
  const [municipios, setMunicipios] = useState<CaixaMunicipio[]>([])
  const [municipiosLoading, setMunicipiosLoading] = useState(false)
  const [selectedUF, setSelectedUFState] = useState<CaixaUF | null>(null)
  const [selectedMunicipioState, setSelectedMunicipioState] = useState<CaixaMunicipio | null>(null)
  const [municipioSearch, setMunicipioSearch] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'done' | 'denied'>('idle')

  const [pendingUFSg, setPendingUFSg] = useState<string | null>(null)
  const [pendingCity, setPendingCity] = useState<string | null>(null)
  const [pendingCodigo, setPendingCodigo] = useState<number | null>(null)

  useEffect(() => {
    fetchUFs().then(setUfs).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedUF) { setMunicipios([]); return }
    setMunicipios([])
    setSelectedMunicipioState(null)
    setMunicipioSearch('')
    setMunicipiosLoading(true)
    fetchMunicipios(selectedUF.sgUf)
      .then(setMunicipios)
      .catch(() => {})
      .finally(() => setMunicipiosLoading(false))
  }, [selectedUF])

  useEffect(() => {
    if (!pendingUFSg || ufs.length === 0) return
    const uf = ufs.find((u) => u.sgUf === pendingUFSg)
    if (uf) {
      setSelectedUFState(uf)
      setPendingUFSg(null)
    }
  }, [pendingUFSg, ufs])

  // Restore by codigo (from cache — exact match)
  useEffect(() => {
    if (!pendingCodigo || municipios.length === 0 || selectedMunicipioState) return
    const match = municipios.find((m) => m.codigo === pendingCodigo)
    if (match) {
      setSelectedMunicipioState(match)
      setPendingCodigo(null)
    }
  }, [pendingCodigo, municipios, selectedMunicipioState])

  // Restore by name (from geolocation)
  useEffect(() => {
    if (!pendingCity || municipios.length === 0) return
    const target = norm(pendingCity)
    const match = municipios.find((m) => norm(m.nome) === target)
    if (match) {
      setSelectedMunicipioState(match)
      setMunicipioSearch('')
      setPendingCity(null)
    }
  }, [pendingCity, municipios])

  async function tryAutoGeo() {
    if (!navigator?.geolocation || geoStatus !== 'idle') return
    if (!window.isSecureContext) return
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      if (perm.state === 'granted') requestGeo()
    } catch {
      // Permissions API not supported (older browsers) — skip auto-detect
    }
  }

  function requestGeo() {
    if (!navigator?.geolocation || geoStatus === 'detecting') return
    if (!window.isSecureContext) return
    setGeoStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'FinanSim/1.0 (simulador habitacional)' } }
          )
          const data = await res.json()
          const iso = data.address?.['ISO3166-2-lvl4'] as string | undefined
          const sgUf = iso?.split('-')[1]
          if (sgUf) setPendingUFSg(sgUf)
          const city: string = data.address?.city || data.address?.town || data.address?.village || ''
          if (city) setPendingCity(city)
          setGeoStatus('done')
        } catch {
          setGeoStatus('done')
        }
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    )
  }

  function setSelectedUF(uf: CaixaUF | null) {
    setSelectedUFState(uf)
    setPendingUFSg(null)
    setGeoStatus('idle')
  }

  function setSelectedMunicipio(m: CaixaMunicipio | null) {
    setSelectedMunicipioState(m)
    setGeoStatus('idle')
  }

  function handleMunicipioSearch(s: string) {
    setMunicipioSearch(s)
    if (s.length > 0) setGeoStatus('idle')
  }

  function loadFromCache(cached: { ufSgUf?: string; municipioCodigo?: number; municipioNome?: string }) {
    if (cached.ufSgUf) setPendingUFSg(cached.ufSgUf)
    if (cached.municipioCodigo) setPendingCodigo(cached.municipioCodigo)
    else if (cached.municipioNome) setPendingCity(cached.municipioNome)
  }

  const municipiosFiltrados = municipios
    .filter((m) => !municipioSearch || norm(m.nome).includes(norm(municipioSearch)))
    .slice(0, 80)

  const geoAvailable = typeof window !== 'undefined' && !!navigator?.geolocation && window.isSecureContext

  return {
    ufs, municipios, municipiosFiltrados, municipiosLoading,
    selectedUF, setSelectedUF,
    selectedMunicipio: selectedMunicipioState, setSelectedMunicipio,
    municipioSearch, setMunicipioSearch: handleMunicipioSearch,
    geoStatus, geoAvailable, requestGeo, tryAutoGeo,
    loadFromCache,
  }
}
