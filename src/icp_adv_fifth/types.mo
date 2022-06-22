import List "mo:base/List";
import IC "./ic";

module {
    public type Proposal = {
        proposal_id : Nat;
        proposal_maker : Principal;
        proposal_content : Text;
        proposal_approvers : [Principal];
        proposal_completed: Bool;
        proposal_total: Nat;
        proposal_exe_method : ExecuteMethod;
        proposal_exe_target : Principal;
        proposal_wasm_module : ?Blob;
        proposal_wasm_hash : [Nat8];
    };

    public type ExecuteMethod = {
        #addMember;
        #delMember;
        #addRestriction;
        #removeRestriction;
        #installCode;
        #start;
        #stop;
        #delete;
    };

    public type CanisterInfo = {canister : IC.canister_id; beRestricted : Bool};
}