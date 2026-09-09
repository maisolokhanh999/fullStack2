import { test, expect } from '@playwright/test'
import { startBrowserApi } from '../../backend/tests/support/browserApi.js'

test('real frontend and API: visitor selection, login, booking, deposit and final payment', async ({ page }) => {
  const api = await startBrowserApi()
  try {
    // Forward to actual Express controllers + isolated MongoDB, not response
    // fixtures. All other external traffic is blocked, including payment images.
    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.origin === 'http://127.0.0.1:5178') return route.continue()
      if (url.origin !== 'https://fullstack2-sdtf.onrender.com') return route.abort()
      const response = await page.request.fetch(`${api.url}${url.pathname}${url.search}`, {
        method: request.method(), headers: request.headers(), data: request.postData() || undefined,
      })
      await route.fulfill({ response })
    })
    const login = async (email) => {
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
      await page.getByLabel('Mật khẩu', { exact: true }).fill('browser-test-only')
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    }
    await page.goto('/')
    await page.getByRole('button', { name: 'Thêm một người' }).click()
    await page.getByRole('button', { name: 'Đặt bàn trước' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await login(api.customer.email)
    await expect(page).toHaveURL(/\/booking\/ban-viet$/)
    await expect(page.getByRole('combobox', { name: 'Số khách', exact: true })).toHaveValue('3')
    const date = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    await page.getByLabel('Ngày đến', { exact: true }).fill(date)
    await page.getByRole('combobox', { name: 'Giờ đến', exact: true }).selectOption('12:00')
    await page.getByRole('combobox', { name: 'Chọn bàn', exact: true }).selectOption(String(api.table._id))
    await page.getByRole('button', { name: 'Tiếp tục chọn món' }).click()
    await page.getByRole('button', { name: 'Thêm Món kiểm thử', exact: true }).click()
    await page.getByRole('button', { name: 'Xem lại đặt bàn', exact: true }).click()
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn', exact: true }).click()
    await expect(page).toHaveURL(/\/bookings$/)
    await expect(page.getByText('Đã gửi yêu cầu đặt bàn', { exact: true })).toBeVisible()
    // Missing bank config must not hide the booking history.
    await expect(page.getByRole('alert')).toContainText('Không tải được mã QR')
    const reservation = await api.Reservation.findOne()
    await expect(page.getByText(reservation.reservationCode, { exact: true }).first()).toBeVisible()
    const invoice = await api.Invoice.findOne()
    expect(invoice.totalAmount).toBe(90000)
    expect(invoice.depositAmount).toBe(60000)
    expect(invoice.finalAmount).toBe(90000)
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
    await page.goto('/login')
    await login(api.staff.email)
    await page.goto('/staff/payments')
    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Xác nhận đã nhận cọc' }).click()
    await expect(page.locator('.staff-invoice-card__amount')).toContainText('30.000')
    await page.getByRole('button', { name: 'Chốt hóa đơn để thanh toán' }).click()
    await page.getByLabel('Tiền khách đưa', { exact: true }).fill('50000')
    await page.getByRole('button', { name: 'Xác nhận thanh toán', exact: true }).click()
    await expect(page.locator('.admin-status-badge')).toHaveAttribute('data-status', 'Paid')
    const paid = await api.Invoice.findById(invoice._id)
    expect(paid.finalAmount).toBe(30000)
    expect(paid.changeAmount).toBe(20000)
    expect(String(paid.paidBy)).toBe(String(api.staff._id))
  } finally { await api.close() }
})
