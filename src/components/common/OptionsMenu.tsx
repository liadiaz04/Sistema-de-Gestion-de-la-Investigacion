"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import "./OptionsMenu.css"

interface OptionsMenuProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({ onView, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="options-menu" ref={menuRef}>
      <button type="button" className="options-menu-trigger" onClick={() => setIsOpen(!isOpen)} aria-label="Opciones">
        ⋮
      </button>
      {isOpen && (
        <div className="options-menu-dropdown">
          {onView && (
            <button
              type="button"
              className="options-menu-item"
              onClick={() => {
                onView()
                setIsOpen(false)
              }}
            >
              Ver detalles
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="options-menu-item"
              onClick={() => {
                onEdit()
                setIsOpen(false)
              }}
            >
              Modificar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="options-menu-item delete"
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
