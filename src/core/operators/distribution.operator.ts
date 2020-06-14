import {
    NodeGroup,
    ActivationFunctionsCollection,
    CostFunctionTypes,
    CostFunctionsCollection,
    DerivativeFunctionsCollection,
} from '../../common/structures/types.struct';

import {
    Getlib
} from '../../common/structures/general/decorators';

import {
    deltaRule,
} from '../../common/lib/scientific.lib';
import { randNum } from '../../common/lib/utils.lib';

/**
 * Unit suited for data distribution across the neural network.
 */
@Getlib({
    activations: 'common/lib/functions/activations.lib',
    costs: 'common/lib/functions/costs.lib',
    derivatives: 'common/lib/functions/derivatives.lib',
})
export class DistributionUnit {
    /**
     * Provided input data.
     */
    public inputData: number[] = [];

    /**
     * Expected data.
     */
    public targetData: number[] = [];

    /**
     * Generated descriptive T2 layer object.
     */
    private layers: NodeGroup[];

    /**
     * Chosen error function.
     */
    private costFunction: CostFunctionTypes;

    /**
     * Input batch size.
     */
    private batchSize: number = 1;

    /**
     * Learning rate coefficient.
     */
    private learningRate: number = 1;

    /**
     * When learning rate is being modified, these are the rates.
     */
    private learningRateTuneRates = {
        min: .0001,
        max: .0009,
    };

    /**
     * Deremine whether to track errors during iterations.
     */
    private errorTracking = false;

    /**
     * Collection of activation functions.
     */
    private activations: ActivationFunctionsCollection;

    /**
     * Collection of cost functions.
     */
    private costs: CostFunctionsCollection;

    /**
     * Collection of derivatives of activation functions.
     */
    private derivatives: DerivativeFunctionsCollection;

    /**
     * Previous error correction action (up/down).
     */
    private errorCorrectionIncrease = false;

    /**
     * How many times error can increase in a row.
     */
    private errorFluctuationLimit = 1;

    /**
     * How many times error got worse in a row.
     */
    private errorCounter = 0;

    /**
     * Non-error counter.
     */
    private nonError = 0;

    /**
     * Store layers reference locally and modify it on the fly.
     * 
     * @param layers - T2 layers object
     * @param costFunction - Error function to be used
     * @param learningRate - The learning rate (min. 1)
     * @param errorTracking - Whether to track errors during training
     */
    constructor(
        layers: NodeGroup[],
        costFunction: CostFunctionTypes,
        batchSize: number,
        learningRate: number = 1,
        errorTracking: boolean = false
    ) {
        this.layers = layers;
        this.costFunction = costFunction;
        this.batchSize = batchSize;
        this.learningRate = learningRate;
        this.errorTracking = errorTracking;
    }

    /**
     * Initialize data that will enter the network.
     * 
     * @param data - input dataset
     */
    public initializeInputData(data: number[]) {
        this.inputData = data;
    }

    /**
     * Initialize data that will enter the network.
     * 
     * @param data - input dataset
     */
    public initializeTargetData(data: number[]) {
        this.targetData = data;
    }

    /**
     * Distribute data across the neural network.
     */
    public async iterate() {
        for (let i = 0; i < this.inputData.length; i++) {
            this.layers.forEach((layer) => {
                // Load first layer with input data.
                const input = layer.flags.includes('input');
                const output = layer.flags.includes('output');

                if (input) {
                    layer.collection[0].value = this.inputData[i];
                }

                // Apply activation function on non-input layer.
                layer.collection.forEach((sourceNode) => {
                    if (!input) {
                        const activation = this.activations[layer.activation];
                        sourceNode.weightedSum = sourceNode.value; 
                        sourceNode.value += layer.bias;
                        sourceNode.value = activation(sourceNode.value);
                    }

                    // Start gradient descent backpropagation on last layer.
                    if (output) {
                        const error = this.costs[this.costFunction](this.targetData[i], sourceNode.value);

                        // Attempt to adjust learning rate.
                        this.stochasticLearningRateAdaptation(layer.error, error);
                        layer.error = error;

                        if (this.errorTracking) { console.log(layer.error); }

                        if ((i + 1) % this.batchSize === 0) {
                            this.backpropagate(this.targetData[i]);
                        }
                    }

                    // Adjust target node value (add to it's weighted sum).
                    sourceNode.connectedTo.forEach((sourceConnectionObject) => {
                        sourceConnectionObject.node.value += sourceConnectionObject.weight * sourceNode.value;
                    });
                });
            });
        }
    }

    /**
     * Backpropagate and adjusts node weights.
     * 
     * @param target - Expected output number
     */
    private backpropagate(target: number) {
        // Reverse layer iteration.
        for (let i = this.layers.length - 1; i > -1; i--) {
            const layer = this.layers[i];

            layer.collection.forEach((sourceNode) => {
                const id = sourceNode.id;

                // Apply delta-rule to adjust neural network weights.
                sourceNode.connectedBy.forEach((sourceConnectionObject) => {
                    let delta = deltaRule(
                        target,
                        sourceNode.value,
                        this.derivatives[layer.activation](sourceNode.weightedSum),
                        sourceConnectionObject.node.value,
                        this.learningRate,
                    );
                    
                    sourceConnectionObject.weight -= delta;

                    // Propagate delta change to connected node.
                    const targetConnectionObject = sourceConnectionObject.node.connectedTo.find((targetConnectionObject) => targetConnectionObject.node.id === id);
                    targetConnectionObject.weight = sourceConnectionObject.weight;

                    sourceNode.value = 0;
                });
            });
        }
    }

    /**
     * Attempt to adjust learning rate based on error tendencies.
     * 
     * @param oldError - Previous error
     * @param newError - New error
     */
    private stochasticLearningRateAdaptation(oldError: number, newError: number) {
        // Error has increased.
        if (newError > oldError) {
            this.errorCounter += 1;
            this.nonError = 0;

            // Check if number of allowed subsequent wrrors has passed.
            if (this.errorCounter === this.errorFluctuationLimit) {
                // Adjust learning rate++.
                if (!this.errorCorrectionIncrease) {
                    this.learningRate += randNum(
                        this.learningRateTuneRates.min,
                        this.learningRateTuneRates.max,
                        4,
                    );
                    this.errorCorrectionIncrease = true;
                    // Adjust learning rate--.
                } else {
                    this.learningRate -= randNum(
                        this.learningRateTuneRates.min,
                        this.learningRateTuneRates.max,
                        4,
                    );
                    this.errorCorrectionIncrease = false;
                }
            }
        // Error has decreased.
        } else {
            this.errorCounter = 0;
            this.nonError += 1;
        }
    }
};
