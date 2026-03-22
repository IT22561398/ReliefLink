import { createLogger } from '@relieflink/logger';
import { config } from '../config/index.js';

const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitStats {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  successCount: number;
}

const circuits = new Map<string, CircuitStats>();

export function getCircuit(serviceName: string): CircuitStats {
  let circuit = circuits.get(serviceName);
  if (!circuit) {
    circuit = { state: 'closed', failures: 0, lastFailure: 0, successCount: 0 };
    circuits.set(serviceName, circuit);
  }
  return circuit;
}

export function recordSuccess(serviceName: string): void {
  const circuit = getCircuit(serviceName);

  if (circuit.state === 'half-open') {
    circuit.successCount++;
    if (circuit.successCount >= 3) {
      circuit.state = 'closed';
      circuit.failures = 0;
      circuit.successCount = 0;
      logger.info('Circuit breaker closed', { service: serviceName });
    }
  } else {
    circuit.failures = 0;
  }
}

export function recordFailure(serviceName: string): void {
  const circuit = getCircuit(serviceName);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  circuit.successCount = 0;

  if (circuit.failures >= config.circuitBreaker.failureThreshold) {
    circuit.state = 'open';
    logger.error('Circuit breaker opened', {
      service: serviceName,
      failures: circuit.failures
    });
  }
}

export function isCircuitOpen(serviceName: string): boolean {
  const circuit = getCircuit(serviceName);
  const now = Date.now();

  if (circuit.state === 'open') {
    if (now - circuit.lastFailure >= config.circuitBreaker.resetTimeout) {
      circuit.state = 'half-open';
      circuit.successCount = 0;
      logger.info('Circuit breaker half-open', { service: serviceName });
      return false;
    }
    return true;
  }

  return false;
}

export function getCircuitStatus(): Record<string, CircuitStats> {
  const status: Record<string, CircuitStats> = {};
  for (const [name, circuit] of circuits.entries()) {
    status[name] = { ...circuit };
  }
  return status;
}
