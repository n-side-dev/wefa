import axios from 'axios'
import type { AxiosInstance, CreateAxiosDefaults } from 'axios'

// Initializes and exposes a singleton axios instance,
// try to use BACKEND_BASE_URL as baseUrl

export const BACKEND_BASE_URL: string = import.meta.env.BACKEND_BASE_URL

const axiosConfig: CreateAxiosDefaults = {}

const axiosInstance: AxiosInstance = axios.create({
  ...axiosConfig,
})

if (!BACKEND_BASE_URL) {
  console.warn(
    'Attempting to create the axios singleton, but BACKEND_BASE_URL is empty! You need to set it up with axiosInstance.defaults.baseURL = "..."'
  )
} else {
  axiosInstance.defaults.baseURL = BACKEND_BASE_URL
}

export default axiosInstance
