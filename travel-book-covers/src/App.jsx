import React, { useState } from 'react'
import CountryPicker from './components/CountryPicker'
import DesignStudio from './components/DesignStudio'
import PhotoPage from './components/PhotoPage'
import ReorderPage from './components/ReorderPage'
import BookPreview from './components/BookPreview'

const STEP = {
  COUNTRY: 'country',
  DESIGN: 'design',
  PHOTOS: 'photos',
  REORDER: 'reorder',
  PREVIEW: 'preview',
}

export default function App() {
  const [step, setStep] = useState(STEP.COUNTRY)
  const [country, setCountry] = useState(null)
  const [design, setDesign] = useState(null)
  const [photos, setPhotos] = useState([])

  function handleCountrySelect(c) {
    setCountry(c)
    setStep(STEP.DESIGN)
  }

  function handleDesignConfirm(d) {
    setDesign(d)
    setStep(STEP.PHOTOS)
  }

  function handlePhotosDone(newPhotos) {
    setPhotos(newPhotos)
    setStep(STEP.REORDER)
  }

  function handleReorderDone(orderedPhotos) {
    setPhotos(orderedPhotos)
    setStep(STEP.PREVIEW)
  }

  function handleBackFromPhotos(currentPhotos) {
    if (currentPhotos) setPhotos(currentPhotos)
    setStep(STEP.PHOTOS)
  }

  return (
    <div className="app">
      {step === STEP.COUNTRY && (
        <CountryPicker onSelect={handleCountrySelect} />
      )}

      {step === STEP.DESIGN && country && (
        <DesignStudio
          country={country}
          onBack={() => setStep(STEP.COUNTRY)}
          onConfirm={handleDesignConfirm}
        />
      )}

      {step === STEP.PHOTOS && design && (
        <PhotoPage
          design={design}
          initialPhotos={photos}
          onBack={() => setStep(STEP.DESIGN)}
          onDone={handlePhotosDone}
        />
      )}

      {step === STEP.REORDER && design && (
        <ReorderPage
          design={design}
          initialPhotos={photos}
          onBack={handleBackFromPhotos}
          onDone={handleReorderDone}
        />
      )}

      {step === STEP.PREVIEW && design && (
        <BookPreview
          design={design}
          photos={photos}
          onEditDesign={() => setStep(STEP.DESIGN)}
          onEditPhotos={() => setStep(STEP.REORDER)}
        />
      )}
    </div>
  )
}
