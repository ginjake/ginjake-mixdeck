class MidiController {
  constructor() {
    this.midiAccess = null;
    this.input = null;
    this.onMessage = null;
  }

  async initialize() {
    try {
      // Web MIDI APIを使用
      this.midiAccess = await navigator.requestMIDIAccess();
      
      // 利用可能なMIDI入力デバイスを取得
      const inputs = this.midiAccess.inputs.values();
      
      for (let input of inputs) {
        // カスタムキーボード（lovelive9）を優先的に探す
        if (input.name && (
          input.name.toLowerCase().includes('lovelive') ||
          input.name.toLowerCase().includes('qmk') ||
          input.name.toLowerCase().includes('keyboard')
        )) {
          this.input = input;
          this.input.onmidimessage = this.handleMidiMessage.bind(this);
          console.log('Custom keyboard connected:', input.name);
          break;
        }
      }
      
      // カスタムキーボードが見つからない場合は最初のMIDI入力デバイスを使用
      if (!this.input) {
        const firstInput = inputs.next().value;
        if (firstInput) {
          this.input = firstInput;
          this.input.onmidimessage = this.handleMidiMessage.bind(this);
          console.log('MIDI device connected:', firstInput.name);
        } else {
          throw new Error('No MIDI input devices found');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      throw error;
    }
  }

  handleMidiMessage(event) {
    const message = Array.from(event.data);
    console.log('MIDI message received:', message);
    
    if (this.onMessage) {
      this.onMessage(message);
    }
  }

  close() {
    if (this.input) {
      this.input.onmidimessage = null;
      this.input = null;
    }
    this.midiAccess = null;
  }

  // lovelive9キーボードのコントロールマッピング
  static get LOVELIVE9_MAPPING() {
    return {
      // キーボードのMIDI CCマッピング (keymap.cで定義済み)
      PLAYLIST1: 1,    // CC1
      PLAYLIST2: 2,    // CC2
      MIDI3: 3,        // CC3
      MIDI4: 4,        // CC4
      MIDI5: 5,        // CC5
      MIDI6: 6,        // CC6
      MIDI7: 7,        // CC7
      MIDI8: 8,        // CC8
      MIDI9: 9,        // CC9
      MIDI10: 10,      // CC10
      MIDI11: 11,      // CC11
      MIDI12: 12,      // CC12
      MIDI13: 13,      // CC13
      MIDI14: 14       // CC14
    };
  }

  // MIDI CCメッセージをデコード
  decodeMidiMessage(message) {
    const [status, cc, value] = message;
    
    if ((status & 0xF0) === 0xB0) { // Control Change
      const control = Object.keys(this.constructor.LOVELIVE9_MAPPING).find(
        key => this.constructor.LOVELIVE9_MAPPING[key] === cc
      );
      
      return {
        type: 'control_change',
        control: control || `CC${cc}`,
        value: value,
        pressed: value > 0
      };
    }
    
    return {
      type: 'unknown',
      raw: message
    };
  }
}

export default MidiController;