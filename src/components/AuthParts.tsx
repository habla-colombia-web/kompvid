import { useId, useState, type InputHTMLAttributes } from 'react'
import './auth.css'

type FieldProps = { label: string; icon: 'mail' | 'lock'; password?: boolean } & InputHTMLAttributes<HTMLInputElement>

export function Field({ label, icon, password, ...input }: FieldProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const type = password ? (show ? 'text' : 'password') : input.type
  return (
    <div className="au-field">
      <label htmlFor={id}>{label}</label>
      <span className="au-input">
        <svg className="au-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon === 'mail'
            ? <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 6 10-6" /></>
            : <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>}
        </svg>
        <input {...input} id={id} type={type} />
        {password && (
          <button type="button" className="au-eye" onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {show
                ? <><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5.6 19 2 12 2 12a18 18 0 0 1 4.1-5.1M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2" /><path d="M1 1l22 22" /></>
                : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>}
            </svg>
          </button>
        )}
      </span>
    </div>
  )
}

export function StrengthMeter({ password }: { password: string }) {
  let s = 0
  if (password.length >= 8) s++
  if (password.length >= 12) s++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++
  if (/\d/.test(password)) s++
  if (/[^A-Za-z0-9]/.test(password)) s++
  const label = !password ? '' : s <= 1 ? 'Débil' : s <= 3 ? 'Media' : 'Fuerte'
  const color = s <= 1 ? '#e5484d' : s <= 3 ? '#f5a524' : '#22c993'
  return (
    <div aria-live="polite">
      <div className="au-meter"><span style={{ width: (password ? Math.max(8, s * 20) : 0) + '%', background: color }} /></div>
      <p className="au-hint">{label ? 'Seguridad de la contraseña: ' + label + '. ' : ''}Usa al menos 8 caracteres; con mayúsculas, números y símbolos es más segura.</p>
    </div>
  )
}