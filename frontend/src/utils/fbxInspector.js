export async function inspectFbx(url) {
  const { FBXLoader } = await import(
    'https://cdn.jsdelivr.net/npm/three@0.166/examples/jsm/loaders/FBXLoader.js'
  )

  const loader = new FBXLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      object => {
        resolve({
          children: object.children.length,
          animations: object.animations?.length || 0,
        })
      },
      undefined,
      error => {
        console.error('FBX inspect error', error)
        reject(error)
      }
    )
  })
}
