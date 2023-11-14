export default class Channel {  
  constructor (config) {
    this._config = config;
  }

  verify () {
    throw new Error('No such implementation exists');
  }

  deploy () {
    throw new Error('No such implementation exists');
  }

  cleanup () {
    throw new Error('No such implementation exists');
  }

  matches () {
    throw new Error('No such implementation exists');
  }
}
