import mitt from 'mitt';

type Events = {
  setSettingsBtnShow: boolean;
};

export const emitter = mitt<Events>();
