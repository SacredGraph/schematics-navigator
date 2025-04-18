export interface Pin {
  pinName: string;
  pinFriendlyName: string;
  net: {
    name: string;
  };
  node: {
    name: string;
    part: {
      name: string;
    };
  };
}

export interface NodeInfo {
  node: {
    name: string;
    part: {
      name: string;
    };
    pins: Pin[];
  };
}

export interface NetInfo {
  name: string;
  type: string;
  pins: Pin[];
}

export interface Node {
  name: string;
  type: string;
  partName?: string;
}

export interface NodePart {
  node: string;
  part: string;
}

export interface Connection {
  from: string;
  to: string;
  pinName: string;
  pinFriendlyName: string;
}

export interface Path {
  nodes: Node[];
  connections: Connection[];
}
