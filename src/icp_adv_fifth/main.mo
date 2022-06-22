import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import IC "./ic";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import SHA256 "mo:sha256/SHA256";
import Trie "mo:base/Trie";
import Types "./types";

actor class (m : Nat, memberArray : [Principal]) = self {
    var members : [Principal] = memberArray;
    var canisters : HashMap.HashMap<IC.canister_id, Bool> = HashMap.HashMap<IC.canister_id, Bool>(0, func(x: IC.canister_id, y: IC.canister_id) {x==y}, Principal.hash);
    // var canisters : List.List<Principal> = List.nil<Principal>();
    // var proposals : List.List<Types.Proposal> = List.nil<Types.Proposal>();
    var proposalsTrie : Trie.Trie<Nat, Types.Proposal> = Trie.empty();
    var proposalId : Nat = 0;
    let PASS_NUM : Nat = 2;

    public shared({caller}) func create_canister() : async IC.canister_id {
        assert(check_member(caller));
        let settings = {
            freezing_threshold = null;
            controllers = ?[Principal.fromActor(self)];
            memory_allocation = null;
            compute_allocation = null;
        };
        let ic : IC.Self = actor("aaaaa-aa");
        Cycles.add(1_000_000_000_000);
        let result = await ic.create_canister({ settings = ?settings; });
        canisters.put(result.canister_id, false);
        result.canister_id
    };

    public shared({caller}) func install_code(canister_id : IC.canister_id, wasm_module : ?Blob) : async (){
        let beRestricted = canisters.get(canister_id);
        switch (beRestricted){
            case null Debug.print("canister <" # Principal.toText(canister_id) # "> not exists");
            case (?b) {
                if (b){
                    await add_proposal("update canister <" # Principal.toText(canister_id) # "> with wasm_module", 
                        #installCode,
                        canister_id, 
                        wasm_module);
                }else{
                    await local_install_code(canister_id, Blob.toArray(Option.unwrap(wasm_module)));
                }
            };
        }
    };

    public shared({caller}) func start_canister(canister_id : IC.canister_id) : async (){
        let beRestricted = canisters.get(canister_id);
        switch (beRestricted){
            case null Debug.print("canister <" # Principal.toText(canister_id) # "> not exists");
            case (?b) {
                if (b){
                    await add_proposal("start canister <" # Principal.toText(canister_id) # ">", 
                        #start,
                        canister_id, 
                        null);
                }else{
                    await local_start_canister(canister_id);
                }
            };
        }
    };

    public shared({caller}) func stop_canister(canister_id : IC.canister_id) : async (){
        let beRestricted = canisters.get(canister_id);
        switch (beRestricted){
            case null Debug.print("canister <" # Principal.toText(canister_id) # "> not exists");
            case (?b) {
                if (b){
                    await add_proposal("stop canister <" # Principal.toText(canister_id) # ">", 
                        #stop,
                        canister_id, 
                        null);
                }else{
                    await local_stop_canister(canister_id);
                }
            };
        };
    };

    public shared({caller}) func delete_canister(canister_id : IC.canister_id) : async (){
        let beRestricted = canisters.get(canister_id);
        switch (beRestricted){
            case null Debug.print("canister <" # Principal.toText(canister_id) # "> not exists");
            case (?b) {
                if (b){
                    await add_proposal("delete canister <" # Principal.toText(canister_id) # ">", 
                        #delete,
                        canister_id, 
                        null);
                }else{
                    await local_stop_canister(canister_id);
                }
            };
        };
    };

    // add a proposal
    public shared({caller}) func add_proposal(content : Text, exeMethod : Types.ExecuteMethod, principal : Principal, wasm : ?Blob) : async (){
        assert(check_member(caller));
        proposalId := proposalId + 1;

        let proposal : Types.Proposal = {
            proposal_id = proposalId;
            proposal_maker = caller;
            proposal_content = content;
            proposal_approvers = List.toArray(List.nil<Principal>());
            proposal_completed = false;
            proposal_total = members.size();
            proposal_exe_method = exeMethod;
            proposal_exe_target = principal;
            proposal_wasm_module = wasm;
            proposal_wasm_hash = switch (wasm) { case null []; case (?w) SHA256.sha256(Blob.toArray(Option.unwrap(wasm))); }
        };
        // proposalsTrie := List.push<Types.Proposal>(proposal, proposals);
        proposalsTrie := Trie.put(proposalsTrie, {hash = Hash.hash(proposalId); key = proposalId},
                                Nat.equal, proposal).0;
    };    
    
    //vote for a proposal
    public shared({caller}) func propose(proposal_id : Nat) : async (){
        assert(check_member(caller));
        
        var exeFlag : Bool = false;
        var proposalMaker : ?Principal = null;
        let proposal = Trie.get(proposalsTrie, {hash = Hash.hash(proposal_id); key = proposal_id;}, Nat.equal);
        switch (proposal){
            case (null) Debug.print("proposal_id not exists");
            case (?p) {
                let new_proposal : Types.Proposal = {
                    proposal_id = p.proposal_id;
                    proposal_maker = p.proposal_maker;
                    proposalMaker = p.proposal_maker;
                    proposal_content = p.proposal_content;
                    proposal_approvers = List.toArray(List.push(caller, List.fromArray(p.proposal_approvers)));
                    proposal_completed = if (p.proposal_approvers.size() + 1 >= PASS_NUM) true else false;
                    proposal_total = members.size();
                    proposal_exe_method = p.proposal_exe_method;
                    proposal_exe_target = p.proposal_exe_target;
                    proposal_wasm_module = p.proposal_wasm_module;
                    proposal_wasm_hash = p.proposal_wasm_hash;
                };
                proposalsTrie := Trie.replace(proposalsTrie, {hash = Hash.hash(proposal_id); key = proposal_id},
                                Nat.equal, ?new_proposal).0;
                Debug.print("proposal_approvers count:" # Nat.toText(new_proposal.proposal_approvers.size()) #
                "    PASS_NUM :" # Nat.toText(PASS_NUM));
                if (new_proposal.proposal_approvers.size() == PASS_NUM) {
                    Debug.print("execute :" # Principal.toText(new_proposal.proposal_exe_target));
                    await execute_proposal(new_proposal.proposal_exe_method, 
                                    new_proposal.proposal_exe_target,
                                    new_proposal.proposal_wasm_module);
                };
            }
        };
    };

    // show members
    public shared({caller}) func allMembers() : async [Principal] {
        members
    };

    // get proposals
    public shared({caller}) func get_proposals() : async [Types.Proposal]{
        // proposalsTrie;
        Trie.toArray(proposalsTrie, func (a : Nat, b : Types.Proposal) : Types.Proposal { b })
    };

    // get canisters
    public shared({caller}) func get_canisters() : async [Types.CanisterInfo]{
        var canisterInfo : List.List<Types.CanisterInfo> = List.nil<Types.CanisterInfo>();
        for (can in canisters.entries()){
            let ci : Types.CanisterInfo = { canister = can.0; beRestricted = can.1};
            canisterInfo := List.push(ci, canisterInfo);
        };
        List.toArray(canisterInfo)
    };

    // get caller Principal
    public shared (msg) func whoami() : async Principal {
        Debug.print("caller : " # Principal.toText(msg.caller));
        msg.caller
    };



    // local func ###################################################
    // check if caller is in member list
    func check_member(principal : Principal) : Bool{
        let l = List.fromArray(members);
        List.some(l, func (a : Principal) : Bool { a == principal})
    };

    // add pricipal to member list
    func addMember(principal : Principal) {
        var memberList = List.fromArray(members);
        members := List.toArray(List.push(principal, memberList));
    };

    // del principal to member list
    func deleteMember(principal : Principal) {
        var memberList = List.fromArray(members);
        let a = List.filter(memberList, func(t : Principal) : Bool { t == principal});
    };

    // add restriction for canister
    func add_restriction(canister : IC.canister_id) : (){
        Debug.print("add_restriction : " # Principal.toText(canister));
        ignore canisters.replace(canister, true);
    };

    // remove restriction for canister
    func remove_restriction(canister : IC.canister_id) : (){
        ignore canisters.replace(canister, false);
    };

    // execute proposal
    func execute_proposal(method : Types.ExecuteMethod, target : Principal, wasm : ?Blob) : async (){
        switch(method){
            case (#addRestriction) {
                add_restriction(target);
            };
            case (#removeRestriction) {
                remove_restriction(target);
            };
            case (#installCode) {
                await local_install_code(target, Blob.toArray(Option.unwrap(wasm)));
            };
            case (#start) {
                await local_start_canister(target);
            };
            case (#stop) {
                await local_stop_canister(target);
            };
            case (#delete) {
                await local_delete_canister(target);
            };
            case (#addMember) {
                addMember(target);
            };
            case (#delMember) {
                deleteMember(target);
            };
        }
    };

    func local_start_canister(can_id : IC.canister_id) : async () {
        let ic : IC.Self = actor("aaaaa-aa");
        Cycles.add(1_000_000_000_000);
        await ic.start_canister({canister_id = can_id});
    };

    // 
    func local_install_code(canister_id : IC.canister_id, wasm_module : IC.wasm_module) : async (){
        let ic : IC.Self = actor("aaaaa-aa");
        Cycles.add(1_000_000_000_000);
        await ic.install_code ({
            arg = []; 
            wasm_module = wasm_module;
            mode = #install;
            canister_id = canister_id;
        });
    };

    // 
    func local_stop_canister(canister_id : IC.canister_id) : async (){
        let ic : IC.Self = actor("aaaaa-aa");
        Cycles.add(1_000_000_000_000);
        await ic.stop_canister({canister_id = canister_id});
    };

    // 
    func local_delete_canister(canister_id : IC.canister_id) : async (){
        let ic : IC.Self = actor("aaaaa-aa");
        Cycles.add(1_000_000_000_000);
        await ic.delete_canister({canister_id = canister_id});
    };
};
