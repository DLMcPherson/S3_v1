function flinchStatesMatrix = matrixifyFlinchData(flinches)
    flinchStatesMatrix = [];
    for curFlinch = 1:length(flinches.list)
        flinchState = flinches.list(curFlinch).state;
        flinchStatesMatrix(:, end + 1) = flinchState;
    end
end
