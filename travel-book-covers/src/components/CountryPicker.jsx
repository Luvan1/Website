import React from 'react'
import { COUNTRIES } from '../data/countries'

export default function CountryPicker({ onSelect }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="app-title">Travel Book Covers</h1>
        <p className="app-subtitle">Design a custom photo book cover for your next adventure</p>
      </div>
      <h2 className="section-title">Choose a country</h2>
      <div className="country-grid">
        {COUNTRIES.map(country => (
          <button
            key={country.id}
            className="country-card"
            onClick={() => onSelect(country)}
          >
            <span className="country-flag">{country.flag}</span>
            <span className="country-name">{country.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
