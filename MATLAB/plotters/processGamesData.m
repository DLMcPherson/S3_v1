function processGamesData(participant)

    numGoalGets = zeros(6,1);
    numCrashes = zeros(6,1);
    numInterventions = zeros(6,1);
    numFalseFlags = zeros(6,1);
    score = zeros(6,1);
    seeds = zeros(6,1);
    drivingStyle = zeros(6,1);

    for game = 0:5
        [goals, crashes, flags, falseFlags, scored, seed, style] = processGameData(participant,game)
        %objectiveMeasures(participant-6,game+1,:) = [goals, crashes, flags, falseFlags, scored]
        numGoalGets(game+1) = goals;
        numCrashes(game+1) = crashes;
        numInterventions(game+1) = flags;
        numFalseFlags(game+1) = falseFlags;
        score(game+1) = scored;
        seeds(game+1) = seed;
        drivingStyle(game+1) = style;
    end

    filename = "../../Experiments/"+participant+"/ObjectiveMeasures"
    save(filename,"numGoalGets","numCrashes","numInterventions","numFalseFlags","score","seeds","drivingStyle")

end