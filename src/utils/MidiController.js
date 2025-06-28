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
      
      // DDJ400を探す
      const inputs = this.midiAccess.inputs.values();
      
      for (let input of inputs) {
        // DDJ400の識別
        if (input.name && (
          input.name.toLowerCase().includes('ddj-400') ||
          input.name.toLowerCase().includes('ddj400') ||
          input.name.toLowerCase().includes('pioneer')
        )) {
          this.input = input;
          this.input.onmidimessage = this.handleMidiMessage.bind(this);
          console.log('DDJ400 connected:', input.name);
          break;
        }
      }
      
      // DDJ400が見つからない場合は最初のMIDI入力デバイスを使用
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

  // DDJ400のコントロールマッピング参考
  static get DDJ400_MAPPING() {
    return {
      // デッキA
      PLAY_PAUSE_A: 0x0B,
      CUE_A: 0x0C,
      HOT_CUE_1_A: 0x40,
      HOT_CUE_2_A: 0x41,
      HOT_CUE_3_A: 0x42,
      HOT_CUE_4_A: 0x43,
      
      // デッキB  
      PLAY_PAUSE_B: 0x47,
      CUE_B: 0x48,
      HOT_CUE_1_B: 0x50,
      HOT_CUE_2_B: 0x51,
      HOT_CUE_3_B: 0x52,
      HOT_CUE_4_B: 0x53,
      
      // ジョグホイール
      JOG_A: 0x21,
      JOG_B: 0x22,
      
      
      // チャンネルフェーダー
      CHANNEL_A_FADER: 0x1C,
      CHANNEL_B_FADER: 0x1D,
      
      // EQ
      HIGH_A: 0x07,
      MID_A: 0x0B,
      LOW_A: 0x0F,
      HIGH_B: 0x1B,
      MID_B: 0x1F,
      LOW_B: 0x23,
      
      // ループ
      LOOP_IN_A: 0x54,
      LOOP_OUT_A: 0x55,
      LOOP_IN_B: 0x56,
      LOOP_OUT_B: 0x57
    };
  }
}

export default MidiController;