import { VMScript } from "vm2"
import _ from 'lodash'

export default ({  name = 'unnamed-automation-script', source = '' } = {}) => {
  // When script's source (the code) is not there,
  // we'll break the execution right away..
  if (!source || source.trim().length === 0) {
    return null
  }

  const vms = new VMScript(
    source,
    _.kebabCase(_.deburr(name)) + '.js'
  )

  return vms
}
