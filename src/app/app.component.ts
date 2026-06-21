import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

interface DeploymentInfo {
  buildId: string;
  version: string;
  commit: string;
  builtAt: string;
}

interface Stage {
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  steps: string[];
  accent: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  activeStage = 2;
  deployments = 0;
  clock = new Date();
deployment: DeploymentInfo = {
  buildId: 'MANUAL',
  version: 'local-dev',
  commit: 'working-tree',
  builtAt: 'Not built yet'
};

  private timer?: ReturnType<typeof setInterval>;

  readonly stages: Stage[] = [
    {
      number: '01', title: 'Manual', eyebrow: 'SSH + Docker', accent: '#f5c451',
      description: 'An engineer connects to the server and performs every release step by hand.',
      steps: ['SSH into server', 'Clone repository', 'Build image', 'Run container']
    },
    {
      number: '02', title: 'Pipeline', eyebrow: 'Jenkins on demand', accent: '#58d6a5',
      description: 'The same reliable sequence is stored as code and started with one click.',
      steps: ['Checkout source', 'Build image', 'Replace container', 'Verify health']
    },
    {
      number: '03', title: 'Continuous', eyebrow: 'GitHub webhook', accent: '#65b6ff',
      description: 'A commit becomes the release signal. Jenkins handles the path to production.',
      steps: ['Push commit', 'Webhook fires', 'Pipeline runs', 'Release is live']
    }
  ];

  ngOnInit(): void {
    this.timer = setInterval(() => this.clock = new Date(), 1000);
    fetch('/deployment.json')
      .then((response) => response.ok ? response.json() as Promise<DeploymentInfo> : Promise.reject())
      .then((info) => this.deployment = info)
      .catch(() => undefined);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  selectStage(index: number): void {
    this.activeStage = index;
  }

  simulateDeployment(): void {
    this.deployments += 1;
    this.activeStage = (this.activeStage + 1) % this.stages.length;
  }
}
