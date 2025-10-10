# Network setup

## Stack

- Axios client : makes the HTTP calls
- TanStack Vue Query : state management around calls
- (optional) Hey-API TypeScript : codegen functions and calls from an OpenAPI schema

## Layers

Layers of functionality, starting from the top, way to be used by end-user

1. URL-based or OpenAPI-based wrapper around TanStack

```ts
const { ... } = apiClient.query(ref('/api/my/url'))
const { ... } = apiClient.mutation(ref('/api/my/url'), myBody)

const { ... } = openapiClient.query(getHello, options)
const { ... } = openapiClient.mutation(postHello, options)
```

2. Using TanStack directly

```ts
const {...} = useQuery({
  queryKey: ['myQueryKey'],
  queryFn: async () => {
    return await axios.get('/api/my/url').data
  },
  ...queryOptions
})

const {...} = useMutation({
  mutationFn: async () => {
    return await postHello(options).data
  },
  ...mutationOptions
})
```

3. Make the axios call yourself

```ts
async function myGet() {
  try {
    const response = await axiosInstance.get('/api/my/url')
    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}
```

## Setup order

1. Initialize TanStack Vue Query at app-level
2. Create the axios instance, using the backend URL
3. Create your URL-based API Client
   1. Attach axios to the "client"
   2. Ensure TanStack wrappers are up and running
4. Create your OpenAPI-based API Client, if applicable
   1. Attach axios to the "client"
   2. Ensure TanStack wrappers are up and running
5. Initialize the backendStore
   1. Attach the reactive interceptors on the axios Instance, for authentication
6. You're now ready to make API calls, either using the axios instance directly, or by using the TanStack useQuery or useMutation (wrapped or not)
