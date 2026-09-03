import { useState } from 'react'

const DEFAULT_BASE_URL = 'https://fullstack2-sdtf.onrender.com'

const PRESETS = [
  { label: 'Auth /login', method: 'POST', path: '/auth/login', body: JSON.stringify({ email: 'admin@example.com', password: '123456' }, null, 2) },
  { label: 'Auth /register', method: 'POST', path: '/auth/register', body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: '123456', role: 'customer' }, null, 2) },
  { label: 'Users /me', method: 'GET', path: '/auth/me', body: '' },
  { label: 'Users list', method: 'GET', path: '/users', body: '' },
  { label: 'Categories', method: 'GET', path: '/categories', body: '' },
  { label: 'Dishes', method: 'GET', path: '/dishes', body: '' },
  { label: 'Menus', method: 'GET', path: '/menus', body: '' },
  { label: 'Tables', method: 'GET', path: '/tables', body: '' },
  { label: 'Reservations', method: 'GET', path: '/reservations', body: '' },
  { label: 'Invoices', method: 'GET', path: '/invoices', body: '' },
  { label: 'Upload', method: 'POST', path: '/upload', body: '' },
]

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function ApiTesterPage() {
  const [selectedPreset, setSelectedPreset] = useState('custom')
  const [url, setUrl] = useState(`${DEFAULT_BASE_URL}/auth/login`)
  const [method, setMethod] = useState('POST')
  const [body, setBody] = useState(
    JSON.stringify({ email: 'admin@example.com', password: '123456' }, null, 2),
  )
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')

  const loadPreset = (preset) => {
    if (!preset) {
      setSelectedPreset('custom')
      setMethod('GET')
      setUrl(DEFAULT_BASE_URL)
      setBody('')
      return
    }

    setSelectedPreset(preset.label)
    setMethod(preset.method)
    setUrl(`${DEFAULT_BASE_URL}${preset.path}`)
    setBody(preset.body || '')
  }

  const handleSend = async () => {
    if (!url.trim()) {
      setError('Vui lòng nhập URL API.')
      return
    }

    try {
      const parsedUrl = new URL(url.trim())
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('URL phải bắt đầu bằng http:// hoặc https://.')
    } catch (validationError) {
      setError(validationError.message || 'URL không hợp lệ.')
      return
    }

    if (body.trim() && method !== 'GET' && method !== 'DELETE') {
      try {
        JSON.parse(body)
      } catch {
        setError('Body phải là JSON hợp lệ.')
        return
      }
    }

    try {
      setLoading(true)
      setError('')
      setResponse(null)

      const headers = {}
      if (body && method !== 'GET' && method !== 'DELETE') {
        headers['Content-Type'] = 'application/json'
      }
      if (token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`
      }

      const requestOptions = {
        method,
        headers,
      }

      if (body && method !== 'GET' && method !== 'DELETE' && body.trim() !== '') {
        requestOptions.body = body
      }

      const res = await fetch(url.trim(), requestOptions)
      const text = await res.text()

      let data = text
      try {
        data = JSON.parse(text)
      } catch {
        // keep raw text if not JSON
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data,
      })
    } catch (err) {
      setError(err.message || 'Request failed')
      setResponse(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="api-tester-page">
      <div className="api-tester-shell">
        <div className="api-tester-header">
          <div>
            <p className="section-label">Developer Tools</p>
            <h1>API Tester</h1>
          </div>
          <a href="/" className="secondary-link">Về trang chủ</a>
        </div>

        <div className="api-tester-grid">
          <section className="api-panel">
            <div className="preset-list">
              <button
                type="button"
                className={`preset-chip ${selectedPreset === 'custom' ? 'active' : ''}`}
                onClick={() => loadPreset(null)}
              >
                Custom
              </button>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`preset-chip ${selectedPreset === preset.label ? 'active' : ''}`}
                  onClick={() => loadPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="api-form">
              <div className="field-group">
                <label htmlFor="api-url">URL</label>
                <input
                  id="api-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://fullstack2-sdtf.onrender.com/auth/login"
                />
              </div>

              <div className="row-two">
                <div className="field-group">
                  <label htmlFor="api-method">Method</label>
                  <select id="api-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {methods.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="api-token">Bearer Token</label>
                  <input
                    id="api-token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="api-body">Body (JSON)</label>
                <textarea
                  id="api-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  placeholder={'{\n  "key": "value"\n}'}
                />
              </div>

              <div className="action-row">
                <button type="button" className="primary-btn" onClick={handleSend} disabled={loading}>
                  {loading ? 'Đang gọi...' : 'Gọi API'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setUrl(DEFAULT_BASE_URL)
                    setMethod('GET')
                    setBody('')
                    setError('')
                    setResponse(null)
                    setSelectedPreset('custom')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="api-panel api-response-panel">
            <div className="response-header">
              <h2>Response</h2>
            </div>

            {error ? <div className="status-box error-box">{error}</div> : null}

            {response ? (
              <>
                <div
                  className={`status-box ${response.ok ? 'success-box' : 'warning-box'}`}
                >
                  {response.status} {response.statusText} • {response.ok ? 'OK' : 'Error'}
                </div>

                <pre className="response-box">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </>
            ) : (
              <div className="empty-state">
                Chưa có dữ liệu phản hồi. Hãy thử gọi một endpoint để xem kết quả.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ApiTesterPage
