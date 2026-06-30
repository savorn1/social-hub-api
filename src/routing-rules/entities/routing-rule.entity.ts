import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';

export type RuleConditionField = 'platform' | 'keyword' | 'contactId';
export type RuleConditionOperator = 'equals' | 'contains';

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export type RuleAction = 'assign_agent';

@Entity('routing_rules')
export class RoutingRule extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  conditions: RuleCondition[];

  @Column()
  action: RuleAction;

  @Column({ nullable: true })
  assignedAgentId?: string;
}
