import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AnalisisGeneralView from './AnalisisGeneralView'

vi.mock('../services/api', () => ({
  crearAnalisisEnergetico: vi.fn()
}))

import { crearAnalisisEnergetico } from '../services/api'

describe('AnalisisGeneralView', () => {
  const mockUsuario = 'test@example.com'
  const mockResponse = {
    categoria: 'Moderado',
    probabilidad: 0.65,
    costo_estimado_mensual: '187.50',
    recomendaciones: ['Reducir uso en horario pico', 'Distribuir consumo']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    crearAnalisisEnergetico.mockResolvedValue(mockResponse)
  })

  it('renderiza el formulario con valores por defecto', () => {
    render(<AnalisisGeneralView usuario={mockUsuario} />)
    
    expect(screen.getByLabelText('Consumo Mensual (kWh):')).toHaveValue(250)
    expect(screen.getByLabelText('Tipo de Inmueble:')).toHaveValue('Residencial')
    expect(screen.getByLabelText('Cantidad de Equipos:')).toHaveValue(5)
    expect(screen.getByLabelText('Horas Alto Consumo / día:')).toHaveValue(6)
    expect(screen.getByRole('checkbox', { name: /horario pico/i })).toBeChecked()
  })

  it('valida que la suma de equipos coincida', async () => {
    render(<AnalisisGeneralView usuario={mockUsuario} />)
    
    fireEvent.change(screen.getByLabelText('Cantidad de Equipos:'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Alto Consumo'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Medio Consumo'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Bajo Consumo'), { target: { value: '4' } })
    
    expect(await screen.findByText(/La suma \(9\) debe igualar la cantidad de equipos \(10\)/i)).toBeInTheDocument()
  })

  it('envía formulario válido y muestra resultado', async () => {
    render(<AnalisisGeneralView usuario={mockUsuario} />)
    
    fireEvent.change(screen.getByLabelText('Consumo Mensual (kWh):'), { target: { value: '300' } })
    fireEvent.change(screen.getByLabelText('Cantidad de Equipos:'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Alto Consumo'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Medio Consumo'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Dispositivos Bajo Consumo'), { target: { value: '2' } })
    
    fireEvent.click(screen.getByRole('button', { name: /generar análisis/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Resultado Generado con Éxito')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Moderado')).toBeInTheDocument()
    expect(screen.getByText('187.50')).toBeInTheDocument()
  })

  it('muestra error de validación cuando la suma no coincide', async () => {
    render(<AnalisisGeneralView usuario={mockUsuario} />)
    
    fireEvent.change(screen.getByLabelText('Cantidad de Equipos:'), { target: { value: '5' } })
    
    fireEvent.click(screen.getByRole('button', { name: /generar análisis/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/La suma.*debe igualar/i)).toBeInTheDocument()
    })
  })

  it('abre y cierra sección de datos avanzados', () => {
    render(<AnalisisGeneralView usuario={mockUsuario} />)
    
    const botonAvanzado = screen.getByRole('button', { name: /datos avanzados/i })
    expect(botonAvanzado).toBeInTheDocument()
    
    fireEvent.click(botonAvanzado)
    expect(screen.getByPlaceholderText('Ej: 4')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ej: 85.5')).toBeInTheDocument()
    
    fireEvent.click(botonAvanzado)
    expect(screen.queryByPlaceholderText('Ej: 4')).not.toBeInTheDocument()
  })
})