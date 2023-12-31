import React, { useEffect, useState } from 'react'
import { Chart } from 'chart.js'
import { Button, Card, CardBody, CardHeader, CircularProgress, useDisclosure } from '@nextui-org/react'
import { getFecha } from '../utils/getDataFormatted'
import ModalForm from './ModalForm'
import { createChart } from '../createChart'

const ChartComponent = ({ id, variable, className, configChart, zona }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [loading, setLoading] = useState(true)

  // En el useEffect executem el primer fetch, per a que es vagi carregant el gràfic el primer cop que entra l'usuari
  // de mentres se li ensenyarà un loading fins que la resposta a l'api es completi
  useEffect(() => {
    const canvasContainer = document.getElementById('canvasContainer')
    const canvas = document.getElementById(id)
    const ctx = canvas.getContext('2d')

    const chart = createChart(canvasContainer, ctx, configChart)

    const url = import.meta.env.VITE_API_URL + '/getDataHoraria' + `/${variable}` + `/${new Date().toISOString()}` + `/${zona}`
    fetch(url)
      .then(res => res.json())
      .then(res => {
        chart.data.labels = getFecha(res.map(object => object.interval_temps), '1_h')
        chart.data.datasets[0].data = res.map(object => parseFloat(object.data.toFixed(2)))

        chart.options.scales.y.max = Math.max(parseFloat(chart.data.datasets[0].data)) + configChart.rang
        chart.options.scales.y.min = Math.min(parseFloat(chart.data.datasets[0].data)) - configChart.rang
        // Quan la resposta s'hagi completat, es posa el loading a false i s'actualitza el chart
        setLoading(false)
        chart.update()
      })
      .catch(err => err)

    return () => {
      // Es destrueix el chart quan l'usuari abandona aquella pàgina (qüestió d'optimització i eventListeners)
      chart.destroy()
    }
  }, [])

  // En aquesta funció li passem la id del chart i li fa un reset
  const resetZoom = () => {
    const chart = Chart.getChart(id)
    chart.resetZoom('zoom')
  }

  // S'encarrega de tornar a dibuixar el chart amb la resposta de l'api
  const updateChartModal = (id, respostaFetch, select) => {
    const chart = Chart.getChart(id)
    chart.clear()

    chart.data.labels = getFecha(respostaFetch.map(object => object.interval_temps), select)
    chart.data.datasets[0].data = respostaFetch.map(object => parseFloat(object.data).toFixed(2))
    chart.update()
  }

  return (
    <Card className={className}>
      <CardHeader className='flex justify-between'>
        {configChart.label}
        <div>
          <Button className='mr-2' onPress={resetZoom} >Reset</Button>
          <Button onPress={onOpen}>Interval</Button>
        </div>
        {
          // Aquest modal form és el que es deplega al clicar el botó d'interval. Et permet seleccionar un nou interval
        }
        <ModalForm
          updateChartModal={updateChartModal}
          idChart={id}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          zona={zona}
          variable={variable}
        />
      </CardHeader>
      <CardBody className={loading ? 'hidden w-full' : 'w-full'} id='canvasContainer'>

      <canvas className='overflow-auto' height={240} id={id}></canvas>
      </CardBody>
      {
        // Primer va el circularProgress i després quan es completi la crida a l'api s'ensenyarà el gràfic
      }
      <CircularProgress
        className={!loading ? ' hidden w-full' : 'w-full max-w-[100%] h-full flex justify-center items-center'}
        classNames={{
          svg: 'w-32 h-32 drop-shadow-md',
          value: 'text-xl font-semibold text-white'
        }}
        aria-label='Loading...'
      />
    </Card>
  )
}

export default ChartComponent
