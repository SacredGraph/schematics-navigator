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
  id: string;
  name: string;
  type: string;
}

export interface NodePart {
  id: string;
  name: string;
  type: string;
  nodeId: string;
}

export interface Connection {
  from: string;
  to: string;
  type: string;
}

export interface Path {
  nodes: Node[];
  connections: Connection[];
}
