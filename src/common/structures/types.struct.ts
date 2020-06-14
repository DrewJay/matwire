/**
 * Normalization funciton type.
 */
export type NormalizationFunction = (input: number) => number;

/**
 * Activation function structure.
 */
export type ActivationFunction = (input: number, param?: number) => number;

/**
 * Error function structure.
 */
export type CostFunction = (target: number, output: number) => number;

/**
 * Derivative function structure.
 */
export type DerivativeFunction = ActivationFunction;

/**
 * Range-random generator function.
 */
export type RRGenerator = (low: number, high: number, special?: boolean) => number;

/**
 * Activation functions string representations.
 */
export type ActivationFunctionTypes = 'ReLu' | 'sigmoid' | 'linear';

/**
 * Error function string representations.
 */
export type CostFunctionTypes = 'meanSquaredError';

/**
 * Collection of activation functions.
 */
export type ActivationFunctionsCollection = {
    [key in ActivationFunctionTypes]: ActivationFunction;
}

/**
 * Collection of activation functions.
 */
export type CostFunctionsCollection = {
    [key in CostFunctionTypes]: CostFunction;
}

/**
 * Collection of derivative functions.
 */
export type DerivativeFunctionsCollection = {
    [key in ActivationFunctionTypes]: DerivativeFunction;
}

/**
 * Neural network layer type.
 */
export type Layer = {
    nodes: number;
    activation?: ActivationFunctionTypes;
    bias: number;
};

/**
 * Layer node object.
 */
export type Node = {
    id: string;
    value: number;
    weightedSum: number;
    connectedTo: Connection[];
    connectedBy: Connection[];
};

/**
 * Particular flags for node collections.
 */
export type NodeFlags = 'input' | 'output';

/**
 * Node collection object wrapper.
 */
export type NodeGroup = {
    collection: Node[];
    activation?: ActivationFunctionTypes;
    bias: number;
    flags: NodeFlags[];
    error?: number;
};

/**
 * Group of connected-to/by nodes.
 */
export type Connection = {
    node: Node;
    weight: number | null;
};