import { test, expect } from '@playwright/test'

const user = { _id: 'user-1', name: 'Khách thử', phone: '0901234567', role: 'user' }
const category = { _id: 'cat-1', name: 'Món chính', status: 'active' }
const dish = { _id: 'dish-1', code: 'D1', name: 'Món thứ nhất', categoryId: category, type: 'MainCourse', servingUnit: 'Phần', price: 100000, stock: 10, discount: 0, status: 'Available', isFeatured: false }
const reservation = { _id: 'reservation-1', reservationCode: 'BV-OWN', bookedBy: user._id, customerName: user.name, customerPhone: user.phone, numberOfGuests: 2, expectedCheckInTime: '2026-09-09T12:00:00+07:00', status: 'Pending' }
const invoice = { _id: 'invoice-1', reservationId: reservation._id, payerName: user.name, status: 'Pending', totalAmount: 200000, depositAmount: 40000, finalAmount: 160000 }
const detail = { _id: 'detail-1', itemName: dish.name, quantity: 2, unitPrice: 100000, totalAmount: 200000 }
const table = { _id: 'table-1', tableNumber: 'A1', capacity: 4, status: 'Available' }

// Only this browser context sees these fixtures. Every external request is
// intercepted: tests cannot create reservations or payments on the real API.
async function setup(page, { role = 'user', handlers = {}, currentUser = {}, draft, dishes = [dish] } = {}) {
  const account = { ...user, role, ...currentUser }
  const requests = []
  await page.addInitScript(({ account, draft }) => {
    localStorage.setItem('token', 'test-session')
    if (draft) sessionStorage.setItem(`ban-viet-booking-draft:${account._id}`, JSON.stringify(draft))
  }, { account, draft })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === 'http://127.0.0.1:5178') return route.continue()
    requests.push({ path: url.pathname, method: request.method(), query: url.search, body: request.postDataJSON() })
    const handler = handlers[`${request.method()} ${url.pathname}`]
    if (handler) {
      const response = await handler(request, url)
      if (response.raw !== undefined) return route.fulfill({ status: response.status || 200, contentType: 'text/html', body: response.raw })
      return route.fulfill({ status: response.status || 200, json: response.json ?? { success: true, data: response.data } })
    }
    const data = {
      '/dishes': dishes,
      '/categories': [category],
      '/menus': [],
      '/tables': [table],
      '/reservations': [reservation],
      '/invoices': [invoice],
      '/reservation-tables': [],
      '/invoice-details/invoice/invoice-1': [detail],
    }
    if (url.pathname === '/auth/me') return route.fulfill({ json: { user: account } })
    if (request.method() === 'GET' && url.pathname in data) {
      return route.fulfill({ json: { success: true, data: data[url.pathname] } })
    }
    return route.fulfill({ status: 404, json: { message: `Unhandled test endpoint: ${request.method()} ${url.pathname}` } })
  })
  return requests
}

test('editing another dish resets fields and sends category ID and boolean', async ({ page }) => {
  const second = { ...dish, _id: 'dish-2', code: 'D2', name: 'Món thứ hai', isFeatured: true }
  const requests = await setup(page, { role: 'admin', dishes: [dish, second], handlers: {
    'PUT /dishes/dish-2': async (request) => ({ data: { ...second, ...request.postDataJSON() } }),
  } })
  await page.goto('/admin')
  await page.getByRole('tab', { name: 'Thực đơn', exact: true }).click()
  await page.getByRole('row').filter({ hasText: 'Món thứ nhất' }).getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByLabel('Tên', { exact: true })).toHaveValue(dish.name)
  await page.getByRole('row').filter({ hasText: 'Món thứ hai' }).getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByLabel('Tên', { exact: true })).toHaveValue(second.name)
  await expect(page.getByRole('checkbox')).toBeChecked()
  await page.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(page.locator('.admin-resource-form')).toHaveCount(0)
  const saved = requests.find((entry) => entry.method === 'PUT').body
  expect(saved.categoryId).toBe(category._id)
  expect(saved.isFeatured).toBe(true)
})

test('menu dates remain editable and a new category gets a valid default status', async ({ page }) => {
  const menu = { _id: 'menu-1', name: 'Thực đơn mùa thu', status: 'Active', startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-09-30T00:00:00.000Z' }
  const requests = await setup(page, { role: 'admin', handlers: {
    'GET /menus': async () => ({ data: [menu] }),
    'POST /categories': async (request) => ({ data: { _id: 'cat-new', ...request.postDataJSON() } }),
  } })
  await page.goto('/admin')
  await page.getByRole('tab', { name: 'Thực đơn', exact: true }).click()
  await page.getByRole('tab', { name: 'Bộ thực đơn' }).click()
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByLabel('Ngày bắt đầu')).toHaveValue('2026-09-01')
  await expect(page.getByLabel('Ngày kết thúc')).toHaveValue('2026-09-30')
  await page.getByRole('tab', { name: 'Danh mục', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm danh mục' }).click()
  await page.getByLabel('Tên', { exact: true }).fill('Danh mục mới')
  await page.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Danh mục mới', exact: true })).toBeVisible()
  expect(requests.find((entry) => entry.method === 'POST').body.status).toBe('active')
})

test('removing invoice items refreshes the displayed total', async ({ page }) => {
  let removed = false
  await setup(page, { role: 'admin', handlers: {
    'DELETE /invoice-details/detail-1': async () => { removed = true; return { data: {} } },
    'GET /invoice-details/invoice/invoice-1': async () => ({ data: removed ? [] : [detail] }),
    'GET /invoices/invoice-1': async () => ({ data: { ...invoice, totalAmount: 0, finalAmount: 0 } }),
  } })
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Xem hóa đơn' }).click()
  await expect(page.locator('.admin-invoice__head')).toContainText('160.000')
  await page.getByRole('button', { name: 'Bỏ hết', exact: true }).click()
  await expect(page.locator('.admin-invoice__head')).toContainText('0')
  await expect(page.locator('.admin-invoice__head')).not.toContainText('160.000')
  await expect(page.locator('.invoice-receipt__items tbody tr')).toHaveCount(0)
})

test('deposit QR is visible and is cleared when the invoice is finalized', async ({ page }) => {
  const requests = await setup(page, { role: 'admin', handlers: {
    'GET /invoices/invoice-1/transfer-qr': async (_request, url) => ({ data: { amount: url.searchParams.get('type') === 'deposit' ? 40000 : 160000, transferContent: url.searchParams.get('type') === 'deposit' ? 'COC BV-OWN' : 'HD BV-OWN', qrCode: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' } }),
    'PATCH /invoices/invoice-1/finalize': async () => ({ data: { ...invoice, status: 'Finalized' } }),
  } })
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Xem hóa đơn' }).click()
  await page.getByRole('button', { name: 'Tạo QR tiền cọc' }).click()
  await expect(page.locator('.invoice-transfer-qr')).toContainText('COC BV-OWN')
  await page.getByRole('button', { name: 'Chốt hóa đơn', exact: true }).click()
  await page.getByLabel('Phương thức').selectOption('BankTransfer')
  await expect(page.locator('.invoice-transfer-qr')).toHaveCount(0)
  await page.getByRole('button', { name: 'Tạo QR chuyển khoản', exact: true }).click()
  await expect(page.locator('.invoice-transfer-qr')).toContainText('HD BV-OWN')
  expect(requests.filter((entry) => entry.path.endsWith('transfer-qr')).map((entry) => entry.query)).toEqual(['?type=deposit', '?type=final'])
})

test('history uses account ownership even after phone changes', async ({ page }) => {
  await setup(page, { currentUser: { phone: '' }, handlers: {
    'GET /reservations': async () => ({ data: [reservation, { ...reservation, _id: 'other', reservationCode: 'BV-OTHER', bookedBy: 'user-2' }] }),
    'GET /invoices': async () => ({ status: 500, json: { message: 'Invoices unavailable' } }),
  } })
  await page.goto('/bookings')
  await expect(page.getByRole('heading', { name: 'BV-OWN' })).toBeVisible()
  await expect(page.getByText('BV-OTHER')).toHaveCount(0)
  await expect(page.getByText('Invoices unavailable')).toHaveCount(0)
})

test('closing an invoice while it loads does not reopen the modal', async ({ page }) => {
  await setup(page, { handlers: {
    'GET /invoices/reservation/reservation-1': async () => {
      await new Promise((resolve) => setTimeout(resolve, 350))
      return { data: invoice }
    },
  } })
  await page.goto('/bookings')
  await page.getByRole('button', { name: 'Xem', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click()
  await page.waitForTimeout(500)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

async function reviewBooking(page) {
  await page.goto('/booking/ban-viet')
  await page.getByRole('button', { name: 'Tiếp tục chọn món' }).click()
  await page.getByRole('button', { name: 'Bỏ qua chọn món' }).click()
}
const draft = { visitDate: '2026-09-09', visitTime: '12:00', guests: 2, tableId: table._id, items: [] }

test('booking serializes Vietnam offset even when the browser runs in UTC', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T00:00:00Z'))
  const requests = await setup(page, { draft, handlers: {
    'POST /reservations': async () => ({ data: reservation }),
    'POST /reservation-tables': async () => ({ data: { _id: 'assignment' } }),
  } })
  await reviewBooking(page)
  await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn', exact: true }).click()
  await expect(page).toHaveURL(/\/bookings$/)
  expect(requests.find((entry) => entry.path === '/reservations' && entry.method === 'POST').body.expectedCheckInTime).toBe('2026-09-09T12:00:00+07:00')
  expect(requests.find((entry) => entry.path === '/reservations' && entry.method === 'POST').body.tableId).toBe(table._id)
  expect(requests.filter((entry) => entry.path === '/reservation-tables' && entry.method === 'POST')).toHaveLength(0)
})

test('table conflict returns to table selection without creating a second reservation', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T00:00:00Z'))
  const requests = await setup(page, { draft, handlers: {
    'POST /reservations': async () => ({ status: 409, json: { message: 'Bàn vừa được khách khác giữ' } }),
  } })
  await reviewBooking(page)
  await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Bàn vừa được khách khác giữ')
  await expect(page.getByRole('combobox', { name: 'Chọn bàn', exact: true })).toHaveValue('')
  expect(requests.filter((entry) => entry.method === 'POST')).toHaveLength(1)
})

test('staff deposit confirmation updates the balance and removes the deposit QR action', async ({ page }) => {
  await setup(page, { role: 'staff', handlers: {
    'PATCH /invoices/invoice-1/confirm-deposit': async () => ({ data: { ...invoice, depositPaymentStatus: 'Succeeded', finalAmount: 120000 } }),
  } })
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/staff/payments')
  await page.getByRole('button', { name: 'Xác nhận đã nhận cọc' }).click()
  await expect(page.locator('.staff-invoice-card__amount')).toContainText('120.000')
  await expect(page.getByRole('button', { name: 'Tạo QR tiền cọc' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Xác nhận đã nhận cọc' })).toHaveCount(0)
})

test('home hero keeps its intended image ratio on desktop and mobile', async ({ page }, testInfo) => {
  await setup(page)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const hero = page.getByRole('img', { name: /Mâm cơm Việt/ })
    await expect(hero).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const bounds = await hero.boundingBox()
    expect(bounds.height / bounds.width).toBeGreaterThan(0.8)
    expect(bounds.height / bounds.width).toBeLessThan(1.1)
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true })
  }
})

test('booking revalidates an appointment that expired during review', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T00:00:00Z'))
  const requests = await setup(page, { draft })
  await reviewBooking(page)
  await page.clock.setFixedTime(new Date('2026-09-10T00:00:00Z'))
  await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn', exact: true }).click()
  await expect(page.getByText('Ngày đến không thể nằm trong quá khứ.')).toBeVisible()
  expect(requests.filter((entry) => entry.method === 'POST')).toHaveLength(0)
})

test('loads all dish pages and removes deleted dishes from saved drafts', async ({ page }) => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({ ...dish, _id: `dish-${index + 1}`, name: `Món ${index + 1}` }))
  const requests = await setup(page, { draft: { ...draft, items: [{ dishId: 'deleted', name: 'Món đã xóa', quantity: 1, price: 100000 }, { dishId: 'dish-101', name: 'Món 101', quantity: 1, price: 100000 }] }, handlers: {
    'GET /dishes': async (_request, url) => ({ json: { success: true, data: url.searchParams.get('page') === '2' ? [{ ...dish, _id: 'dish-101', name: 'Món 101' }] : firstPage, pagination: { totalPages: 2 } } }),
  } })
  await reviewBooking(page)
  await expect(page.locator('.review-items')).toContainText('Món 101')
  await expect(page.locator('.review-items')).not.toContainText('Món đã xóa')
  expect(requests.some((entry) => entry.path === '/dishes' && entry.query.includes('page=2'))).toBe(true)
})

test('invalid successful response is shown as an error instead of empty success', async ({ page }) => {
  await setup(page, { handlers: { 'GET /dishes': async () => ({ raw: '<html>Proxy error</html>' }) } })
  await page.goto('/')
  await expect(page.getByText('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.')).toBeVisible()
})

test('restaurant cart reflects the saved booking draft', async ({ page }) => {
  await setup(page, { draft: { ...draft, items: [{ dishId: dish._id, name: dish.name, price: 100000, quantity: 2 }] } })
  await page.goto('/restaurants')
  await expect(page.locator('.restaurant-cart__header span')).toHaveText('2')
  await expect(page.locator('.restaurant-cart .review-items')).toContainText(`2 × ${dish.name}`)
  await expect(page.locator('.restaurant-cart__total')).toContainText('200.000')
})

test('staff invoice controls cannot overlap mutations on different invoices', async ({ page }) => {
  let finish
  const pending = new Promise((resolve) => { finish = resolve })
  await setup(page, { role: 'staff', handlers: {
    'GET /invoices': async () => ({ data: [invoice, { ...invoice, _id: 'invoice-2' }] }),
    'GET /invoice-details/invoice/invoice-2': async () => ({ data: [] }),
    'GET /invoices/invoice-1/transfer-qr': async () => { await pending; return { data: {} } },
  } })
  await page.goto('/staff/payments')
  await page.getByRole('button', { name: 'Tạo QR tiền cọc' }).first().click()
  await expect(page.locator('.staff-invoice-card').nth(1).getByRole('button', { name: 'Chốt hóa đơn để thanh toán' })).toBeDisabled()
  finish()
})

test('post-auth redirects do not return to login with query or hash', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  const destination = await page.evaluate(async () => {
    const { getPostAuthPath } = await import('/src/utils/roleNavigation.js')
    return getPostAuthPath('/login?reason=expired#form', { role: 'user' })
  })
  expect(destination).toBe('/')
})

for (const path of ['/', '/restaurants', '/admin']) {
  test(`mobile layout stays within viewport on ${path}`, async ({ page }, testInfo) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.setViewportSize({ width: 390, height: 844 })
    await setup(page, { role: path === '/admin' ? 'admin' : 'user' })
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true })
    expect(pageErrors).toEqual([])
  })
}

test('restored gathering presets retain guests and category links select the menu', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  const gathering = page.locator('#gathering')
  await gathering.getByRole('button', { name: '8', exact: true }).click()
  await expect(gathering.getByRole('button', { name: 'Giữ bàn cho 8 người ↗' })).toBeVisible()
  await gathering.getByRole('button', { name: 'Thêm khách ở bàn tròn' }).click()
  await expect(gathering.getByRole('button', { name: 'Giữ bàn cho 9 người ↗' })).toBeVisible()
  await page.locator('.bv-category').first().click()
  await expect(page).toHaveURL(/category=/)
  await expect(page.getByRole('status')).toContainText('1 món đang hiển thị')
})

test('stories deep link opens readable content', async ({ page }) => {
  await setup(page)
  await page.goto('/#stories')
  await page.locator('#stories summary').first().click()
  await expect(page.locator('#stories details').first()).toHaveAttribute('open', '')
})

for (const width of [390, 1440]) {
  for (const path of ['/login', '/register', '/dashboard', '/#gathering', '/#stories', '/admin']) {
    test(`visual layout ${path} at ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setup(page, { role: 'admin', handlers: path === '/login' || path === '/register' ? { 'GET /auth/me': async () => ({ status: 401, json: { message: 'Sign in' } }) } : {} })
      await page.goto(path)
      await expect(page.locator('main')).toBeVisible()
      if (path.includes('#')) await page.locator(path.slice(1)).scrollIntoViewIfNeeded()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('layout.png'), fullPage: !path.includes('#') })
    })
  }
}


test('creating a dish without touching featured sends false instead of an empty string', async ({ page }) => {
  const requests = await setup(page, { role: 'admin', handlers: {
    'POST /dishes': async (request) => ({ data: { _id: 'created', ...request.postDataJSON() } }),
  } })
  await page.goto('/admin')
  await page.getByRole('tab', { name: 'Thực đơn', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm món ăn', exact: true }).click()
  await page.getByRole('combobox', { name: /^Danh mục/ }).selectOption('cat-1')
  await page.getByLabel('Mã', { exact: true }).fill('NEW001')
  await page.getByLabel('Tên', { exact: true }).fill('Món mới')
  await page.getByRole('combobox', { name: /^Loại/ }).selectOption('SideDish')
  await page.getByRole('combobox', { name: /^Đơn vị/ }).selectOption('Phần')
  await page.getByLabel('Giá', { exact: true }).fill('65000')
  await page.getByLabel('Tồn kho', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(page.locator('.admin-resource-form')).toHaveCount(0)
  expect(requests.find((entry) => entry.method === 'POST').body.isFeatured).toBe(false)
})
