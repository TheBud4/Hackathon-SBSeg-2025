import React, { useEffect, useState } from 'react'

export default function App() {
  const [value, setValue] = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/value')
      .then((r) => r.json())
      .then((data) => setValue(data.value))
      .catch((e) => setValue('Erro: ' + e.message))
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Frontend React + Vite</h1>
      <p>Valor recebido do backend:</p>
      <pre>{value ?? 'Carregando...'}</pre>
    </div>
  )
}
