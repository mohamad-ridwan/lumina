import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchCancelRequested = async ({ page, limit }) => {
  const result = await fetchData(`${clientUrl}/order/cancel-requested`)

  return result
}

export const addJobResponseCancelOrder = async (orderId, responseType, adminId) => {
  const result = await fetchData(
    `${clientUrl}/order/add-job-response-cancel-order?orderId=${orderId}&responseType=${responseType}&adminId=${adminId}`,
    {
      method: 'POST',
    },
  )

  return result
}
