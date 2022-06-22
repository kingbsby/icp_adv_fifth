export const idlFactory = ({ IDL }) => {
  const ExecuteMethod = IDL.Variant({
    'stop' : IDL.Null,
    'addRestriction' : IDL.Null,
    'delete' : IDL.Null,
    'installCode' : IDL.Null,
    'removeRestriction' : IDL.Null,
    'start' : IDL.Null,
    'delMember' : IDL.Null,
    'addMember' : IDL.Null,
  });
  const canister_id = IDL.Principal;
  const CanisterInfo = IDL.Record({
    'canister' : canister_id,
    'beRestricted' : IDL.Bool,
  });
  const Proposal = IDL.Record({
    'proposal_exe_method' : ExecuteMethod,
    'proposal_approvers' : IDL.Vec(IDL.Principal),
    'proposal_wasm_hash' : IDL.Vec(IDL.Nat8),
    'proposal_wasm_module' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'proposal_maker' : IDL.Principal,
    'proposal_total' : IDL.Nat,
    'proposal_completed' : IDL.Bool,
    'proposal_exe_target' : IDL.Principal,
    'proposal_id' : IDL.Nat,
    'proposal_content' : IDL.Text,
  });
  const anon_class_16_1 = IDL.Service({
    'add_proposal' : IDL.Func(
        [IDL.Text, ExecuteMethod, IDL.Principal, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    'allMembers' : IDL.Func([], [IDL.Vec(IDL.Principal)], []),
    'create_canister' : IDL.Func([], [canister_id], []),
    'delete_canister' : IDL.Func([canister_id], [], []),
    'get_canisters' : IDL.Func([], [IDL.Vec(CanisterInfo)], []),
    'get_proposals' : IDL.Func([], [IDL.Vec(Proposal)], []),
    'install_code' : IDL.Func(
        [canister_id, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
        [],
      ),
    'propose' : IDL.Func([IDL.Nat], [], []),
    'start_canister' : IDL.Func([canister_id], [], []),
    'stop_canister' : IDL.Func([canister_id], [], []),
    'whoami' : IDL.Func([], [IDL.Principal], []),
  });
  return anon_class_16_1;
};
export const init = ({ IDL }) => { return [IDL.Nat, IDL.Vec(IDL.Principal)]; };
