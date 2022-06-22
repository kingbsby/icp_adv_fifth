import type { Principal } from '@dfinity/principal';
export interface CanisterInfo {
  'canister' : canister_id,
  'beRestricted' : boolean,
}
export type ExecuteMethod = { 'stop' : null } |
  { 'addRestriction' : null } |
  { 'delete' : null } |
  { 'installCode' : null } |
  { 'removeRestriction' : null } |
  { 'start' : null } |
  { 'delMember' : null } |
  { 'addMember' : null };
export interface Proposal {
  'proposal_exe_method' : ExecuteMethod,
  'proposal_approvers' : Array<Principal>,
  'proposal_wasm_hash' : Array<number>,
  'proposal_wasm_module' : [] | [Array<number>],
  'proposal_maker' : Principal,
  'proposal_total' : bigint,
  'proposal_completed' : boolean,
  'proposal_exe_target' : Principal,
  'proposal_id' : bigint,
  'proposal_content' : string,
}
export interface anon_class_16_1 {
  'add_proposal' : (
      arg_0: string,
      arg_1: ExecuteMethod,
      arg_2: Principal,
      arg_3: [] | [Array<number>],
    ) => Promise<undefined>,
  'allMembers' : () => Promise<Array<Principal>>,
  'create_canister' : () => Promise<canister_id>,
  'delete_canister' : (arg_0: canister_id) => Promise<undefined>,
  'get_canisters' : () => Promise<Array<CanisterInfo>>,
  'get_proposals' : () => Promise<Array<Proposal>>,
  'install_code' : (arg_0: canister_id, arg_1: [] | [Array<number>]) => Promise<
      undefined
    >,
  'propose' : (arg_0: bigint) => Promise<undefined>,
  'start_canister' : (arg_0: canister_id) => Promise<undefined>,
  'stop_canister' : (arg_0: canister_id) => Promise<undefined>,
  'whoami' : () => Promise<Principal>,
}
export type canister_id = Principal;
export interface _SERVICE extends anon_class_16_1 {}
