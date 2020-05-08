
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.handler = async (event, context) => {
  require('dotenv').config()

  const AWS = require('aws-sdk')
  AWS.config.update({region: 'eu-west-2'})
  const ec2 = new AWS.EC2()

  const ACCESS_CODE = process.env.ACCESS_CODE
  const INSTANCE_ID = process.env.INSTANCE_ID
  const USERNAME = process.env.USERNAME
  const PASSWORD = process.env.PASSWORD

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Function not founds...' }
    }
    const accessCode = JSON.parse(event.body).accessCode
    const action = JSON.parse(event.body).action
    console.log('action', action)
    if (accessCode === undefined || accessCode === null || accessCode !== ACCESS_CODE) {
      return { statusCode: 200, body: JSON.stringify({ error: 'Invalid access code' }) }
    }
    if (action === 'start') {
      console.log('start')
      const startRes = await ec2.startInstances({InstanceIds: [INSTANCE_ID]}).promise()
      await sleep(2000)
      console.log('startRes', startRes)
    } else if (action === 'stop') {
      console.log('stop')
      const stopRes = ec2.stopInstances({InstanceIds: [INSTANCE_ID]}).promise()
      await sleep(2000)
      console.log('stopRes', stopRes)
    }
    let instances = await ec2.describeInstances({InstanceIds: [INSTANCE_ID]}).promise()
    // console.log('instances', instances.Reservations[0])
    let instance = instances.Reservations[0].Instances.filter(i => i.InstanceId === INSTANCE_ID)[0]
    // console.log('instance', instance)
    // let status = instances.InstanceStatuses[0].InstanceState.Name
    return { statusCode: 200, body: JSON.stringify({ status: instance.State.Name, url: instance.PublicDnsName, username: USERNAME, password: PASSWORD }) }
  } catch (err) {
    console.log('err', err)
    return { statusCode: 500, body: err.toString() }
  }
}
