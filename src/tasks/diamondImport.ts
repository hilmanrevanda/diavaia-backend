const syncFtpTask = {
  slug: 'syncFtp',
  label: 'Sync products from FTP',
  handler: async () => {
    // const res = await fetch('/api/products/import-csv', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({}),
    // })
    // const data = await res.json()
    // console.log(data)

    console.log('testing')

    return {
      output: {
        total: [0, 1, 2, 3, 4, 5].length,
        preview: [0, 1, 2, 3, 4, 5].slice(0, 5),
      },
    }
  },
  onSuccess: () => {
    console.log('success')
  },
  onFail: () => {
    console.log('fail')
  },
}

export default syncFtpTask
