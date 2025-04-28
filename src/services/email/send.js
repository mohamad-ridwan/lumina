import emailjs from '@emailjs/browser'

export const serviceID = 'service_9jqv5hr'
export const templateID = 'template_dsp9f7o'
export const options = {
  publicKey: 'SPBT4LSXKZe6cJzDt',
}

export const emailSend = async (templateParams) => {
  const result = await emailjs.send(serviceID, templateID, templateParams, options)
  return result
}
