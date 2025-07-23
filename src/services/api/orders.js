import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchCancelRequested = async ({ page, limit }) => {
  const result = await fetchData(`${clientUrl}/order/cancel-requested`)

  return result
}
