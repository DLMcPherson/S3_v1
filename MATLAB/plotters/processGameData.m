function [numberOfGoalGets, numberOfCrashes, numberOfInterventions, numberOfFalsePositives, recordedScore, seed, drivingStyle] = processGameData(participantID,gameID)

    filename = "../../Experiments/"+participantID+"/Subject"+participantID+"Game" + gameID + ".dat"
    fileID = fopen(filename,'r','n','UTF-8');
    text = fscanf(fileID," %s ");
    object = jsondecode(text(2:end) );

    numberOfInterventions = length(object.mouseEvents)
    numberOfCrashes = length(object.collisionEvents)
    % Subtract off 2 from the number of goals achieved due to the initial two
    % goal settings not counting as a score
    numberOfGoalGets = length(object.goalSetEvents) - 2
    reconstitutedScore = 20*numberOfGoalGets - 20*numberOfCrashes - 10*numberOfInterventions
    recordedScore = object.finalScore

    numberOfFalsePositives = 0;
    for i = 1:numberOfInterventions
        mouseXY = object.mouseEvents(i).mouseState;
        flag = false;
        for robotNum = 1:2
            robotXY = object.mouseEvents(i).robots(robotNum).state(1:2);
            robotDistance = norm(robotXY - mouseXY);
            if(robotDistance < 1.8 * 2 & object.mouseEvents(i).robots(1).blindToObstacle)
                flag = true;
            end
        end
        if(flag == false)
            numberOfFalsePositives = numberOfFalsePositives + 1;
        end
    end

    numberOfFalsePositives
    
    seed = object.seed;
    drivingStyle = object.drivingStyle;

end